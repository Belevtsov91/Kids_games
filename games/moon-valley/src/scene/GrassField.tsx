// Густой луг: тысячи травинок одним вызовом отрисовки. Качаются на ветру и приминаются под героем.

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Color, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import { generateGrass } from '../game/world';
import { useRuntime } from '../app/runtime';
import { patchWind, windUniforms } from './wind';

const BLADE_HEIGHT = 0.36;

/** Травинка: узкий клин из трёх сегментов, снизу тёмная, к кончику светлая. */
function bladeGeometry() {
  const rows = [
    [0, 0.07],
    [0.38, 0.055],
    [0.72, 0.032],
  ];
  const positions: number[] = [];
  const colors: number[] = [];
  const base = new Color('#3c8a3e');
  const tip = new Color('#94cf5c');
  const c = new Color();
  for (const [y, w] of rows) {
    for (const side of [-1, 1]) {
      positions.push(side * w, y * BLADE_HEIGHT, 0);
      c.copy(base).lerp(tip, y);
      colors.push(c.r, c.g, c.b);
    }
  }
  positions.push(0.012, BLADE_HEIGHT, 0);
  colors.push(tip.r, tip.g, tip.b);
  const front = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6];
  // Обратная сторона — те же вершины в обратном порядке: обе стороны освещены одинаково (нормали вверх).
  const back: number[] = [];
  for (let i = 0; i < front.length; i += 3) back.push(front[i], front[i + 2], front[i + 1]);
  const indices = [...front, ...back];
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // Нормали вверх: трава освещается как луг, а не как плоские листики.
  const normals = geometry.getAttribute('normal');
  for (let i = 0; i < normals.count; i++) normals.setXYZ(i, 0, 1, 0);
  return geometry;
}

export function GrassField({ count }: { count: number }) {
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(bladeGeometry, []);
  const material = useMemo(() => {
    const m = new MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
    patchWind(m, { height: BLADE_HEIGHT * 1.4, amount: 0.12, push: true });
    return m;
  }, []);
  const blades = useMemo(() => generateGrass(count), [count]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new Matrix4();
    const q = new Quaternion();
    const up = new Vector3(0, 1, 0);
    const tint = new Color();
    const warm = new Color('#e8f0a0');
    const cool = new Color('#9fd8a0');
    blades.forEach(([x, z, s, rot], i) => {
      q.setFromAxisAngle(up, rot);
      m.compose(new Vector3(x, 0, z), q, new Vector3(s, s * (0.8 + ((i * 37) % 10) / 20), s));
      mesh.setMatrixAt(i, m);
      // Пятна теплее и холоднее, чтобы луг не был однотонным.
      const n = Math.sin(x * 0.21 + Math.cos(z * 0.13) * 2) * 0.5 + 0.5;
      tint.set('#ffffff').lerp(n > 0.5 ? warm : cool, Math.abs(n - 0.5) * 0.9);
      mesh.setColorAt(i, tint);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [blades]);

  return <instancedMesh ref={ref} args={[geometry, material, blades.length]} receiveShadow frustumCulled={false} />;
}

/** Время ветра и позиция героя для всех шейдеров с ветром. */
export function WindClock() {
  const runtime = useRuntime();
  useFrame((_, delta) => {
    windUniforms.uWindTime.value += Math.min(delta, 0.1);
    windUniforms.uHero.value.set(runtime.hero.x, runtime.hero.z);
  });
  return null;
}
