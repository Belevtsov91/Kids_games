// Инстансинг: много одинаковых моделей (лес, камни, цветы) одним вызовом отрисовки на каждую часть модели.

import { useGLTF } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { InstancedMesh, Matrix4, Mesh, Quaternion, Vector3 } from 'three';
import type { Placed } from '../../game/world';
import { windMaterial, type WindOptions } from '../environment/wind';
import { modelUrl, prepare } from './load';

/**
 * Много одинаковых моделей (лес, камни, цветы) одним вызовом отрисовки на каждую часть модели.
 */
export function Instanced({
  name,
  items,
  shadows = true,
  wind,
}: {
  name: string;
  items: Placed[];
  shadows?: boolean;
  /** Качание на ветру (трава, цветы, кроны). */
  wind?: WindOptions;
}) {
  const { scene } = useGLTF(modelUrl(name));
  const parts = useMemo(() => {
    const root = prepare(scene.clone(true), shadows);
    root.updateMatrixWorld(true);
    const list: { mesh: Mesh; matrix: Matrix4 }[] = [];
    root.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      if (wind && !Array.isArray(child.material)) child.material = windMaterial(child.material, wind);
      list.push({ mesh: child, matrix: child.matrixWorld.clone() });
    });
    return list;
    // wind — постоянный объект у вызывающего.
  }, [scene, shadows]);
  return (
    <>
      {parts.map((part, index) => (
        <InstancedPart key={index} mesh={part.mesh} local={part.matrix} items={items} shadows={shadows} />
      ))}
    </>
  );
}

const up = new Vector3(0, 1, 0);

function InstancedPart({ mesh, local, items, shadows }: { mesh: Mesh; local: Matrix4; items: Placed[]; shadows: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const instanced = ref.current;
    if (!instanced) return;
    const m = new Matrix4();
    const q = new Quaternion();
    items.forEach((item, i) => {
      q.setFromAxisAngle(up, item.rot ?? 0);
      const s = item.scale ?? 1;
      m.compose(new Vector3(item.at[0], 0, item.at[1]), q, new Vector3(s, s, s)).multiply(local);
      instanced.setMatrixAt(i, m);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
  }, [items, local]);
  return (
    <instancedMesh
      ref={ref}
      args={[mesh.geometry, mesh.material, items.length]}
      castShadow={shadows}
      receiveShadow
      frustumCulled={false}
    />
  );
}
