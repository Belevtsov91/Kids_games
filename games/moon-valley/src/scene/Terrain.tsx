// Остров: травяной луг с дорожками и песчаным берегом озера, холмы по краю, скалы и облака снизу.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Color, type Mesh, type MeshStandardMaterial } from 'three';
import { ISLAND_RADIUS, LAKE, PATHS, WALK_RADIUS, type Vec2 } from '../game/world';

const RINGS = 90;
const SEGMENTS = 180;

function pathDistance(x: number, z: number) {
  let best = Infinity;
  for (const path of PATHS)
    for (let i = 0; i < path.length - 1; i++) {
      const [a, b] = [path[i], path[i + 1]];
      const [dx, dz] = [b[0] - a[0], b[1] - a[1]];
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
      best = Math.min(best, Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t)));
    }
  return best;
}

const noise = (x: number, z: number) =>
  Math.sin(x * 0.31 + Math.cos(z * 0.17) * 2) * 0.5 + Math.sin(z * 0.23 + x * 0.11) * 0.35 + Math.sin((x + z) * 0.9) * 0.15;

/** Высота земли вне игровой зоны: холмы у края. В игровой зоне — ровно (кроме чаши озера). */
export function groundHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  const lake = Math.hypot(x - LAKE.center[0], z - LAKE.center[1]);
  let y = 0;
  if (lake < LAKE.radius + 1) y -= Math.max(0, 1 - lake / (LAKE.radius + 1)) ** 0.7 * 1.1;
  if (r > WALK_RADIUS) y += ((r - WALK_RADIUS) / (ISLAND_RADIUS - WALK_RADIUS)) ** 1.6 * (3 + noise(x, z) * 2);
  return y;
}

const GRASS_A = new Color('#5fae55');
const GRASS_B = new Color('#9ad46a');
const GRASS_WARM = new Color('#b8cf62');
const GRASS_DARK = new Color('#4f9450');
const PATH = new Color('#d8b98a');
const SAND = new Color('#ecd9a4');

function buildGround() {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const c = new Color();
  positions.push(0, 0, 0);
  c.copy(GRASS_A);
  colors.push(c.r, c.g, c.b);
  for (let ring = 1; ring <= RINGS; ring++) {
    const r = (ring / RINGS) * ISLAND_RADIUS;
    for (let s = 0; s < SEGMENTS; s++) {
      const a = (s / SEGMENTS) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      positions.push(x, groundHeight(x, z), z);
      const n = noise(x * 1.7, z * 1.7);
      c.copy(GRASS_A).lerp(GRASS_B, 0.5 + n * 0.5);
      // Крупные тёплые пятна (солнечные поляны), чтобы луг не был однотонным.
      const patch = noise(x * 0.45 + 13, z * 0.45 - 7);
      if (patch > 0.35) c.lerp(GRASS_WARM, Math.min(1, (patch - 0.35) * 1.6) * 0.55);
      // Под деревьями на северо-западе — темнее.
      if (x < -6 && z < -10) c.lerp(GRASS_DARK, Math.min(1, (-z - 10) / 10) * 0.6);
      const lake = Math.hypot(x - LAKE.center[0], z - LAKE.center[1]) - LAKE.radius;
      if (lake < 1.8) c.lerp(SAND, Math.min(1, (1.8 - lake) / 1.4));
      const p = pathDistance(x, z);
      if (p < 1.6) c.lerp(PATH, Math.min(1, (1.6 - p) / 0.6));
      colors.push(c.r, c.g, c.b);
    }
  }
  for (let s = 0; s < SEGMENTS; s++) indices.push(0, 1 + ((s + 1) % SEGMENTS), 1 + s);
  for (let ring = 1; ring < RINGS; ring++) {
    const a0 = 1 + (ring - 1) * SEGMENTS;
    const a1 = 1 + ring * SEGMENTS;
    for (let s = 0; s < SEGMENTS; s++) {
      const s1 = (s + 1) % SEGMENTS;
      indices.push(a0 + s, a0 + s1, a1 + s, a0 + s1, a1 + s1, a1 + s);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function Terrain({ night }: { night: boolean }) {
  const ground = useMemo(buildGround, []);
  const water = useRef<Mesh>(null);
  const foam = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const material = water.current?.material as MeshStandardMaterial | undefined;
    if (material) material.emissiveIntensity = (night ? 0.55 : 0.18) + Math.sin(t * 1.3) * 0.05;
    // Пена у берега мягко «дышит».
    if (foam.current) {
      foam.current.scale.setScalar(1 + Math.sin(t * 0.9) * 0.012);
      (foam.current.material as MeshStandardMaterial).opacity = 0.55 + Math.sin(t * 0.9 + 1) * 0.15;
    }
  });
  const lake: Vec2 = LAKE.center;
  return (
    <group>
      <mesh geometry={ground} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} />
      </mesh>
      {/* Скалистый низ острова */}
      <mesh position={[0, -4.2, 0]}>
        <cylinderGeometry args={[ISLAND_RADIUS + 0.2, ISLAND_RADIUS - 9, 8.6, 64, 1, true]} />
        <meshStandardMaterial color="#8a6a52" roughness={1} side={2} />
      </mesh>
      <mesh position={[0, -11, 0]}>
        <coneGeometry args={[ISLAND_RADIUS - 9, 14, 48, 1, true]} />
        <meshStandardMaterial color="#6d5444" roughness={1} side={2} />
      </mesh>
      <mesh position={[0, -8.5, 0]} rotation-x={Math.PI / 2}>
        <circleGeometry args={[ISLAND_RADIUS - 8.8, 48]} />
        <meshStandardMaterial color="#6d5444" />
      </mesh>
      {/* Озеро */}
      <mesh ref={water} userData={{ noAO: true }} position={[lake[0], -0.32, lake[1]]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[LAKE.radius + 0.7, 48]} />
        <meshStandardMaterial
          color={night ? '#3b7fb5' : '#6cc7ea'}
          emissive="#3fb2e8"
          emissiveIntensity={0.2}
          roughness={0.08}
          metalness={0.3}
          transparent
          opacity={0.88}
        />
      </mesh>
      {/* Пена у берега */}
      <mesh ref={foam} userData={{ noAO: true }} position={[lake[0], -0.28, lake[1]]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[LAKE.radius + 0.15, LAKE.radius + 0.75, 64]} />
        <meshStandardMaterial color="#ffffff" emissive="#dff6ff" emissiveIntensity={night ? 0.35 : 0.1} roughness={1} transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </group>
  );
}
