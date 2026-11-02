// Облака: кольцо вдали, медленно плывёт по кругу.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export function Clouds() {
  const group = useRef<Group>(null);
  const clouds = useMemo(
    () =>
      // Кольцом вдали: камера (максимум ~50 от центра) в облако не залетит.
      Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + 0.3;
        const r = 72 + (i % 3) * 8;
        return { a, r, y: 26 + (i % 3) * 4, s: 2 + (i % 3) * 0.6 };
      }),
    [],
  );
  // Облака медленно плывут по кругу.
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.01;
  });
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} position={[Math.cos(c.a) * c.r, c.y, Math.sin(c.a) * c.r]} scale={c.s}>
          {[
            [0, 0, 0, 1.6],
            [1.5, -0.2, 0.3, 1.2],
            [-1.4, -0.3, -0.2, 1.1],
            [0.4, 0.6, -0.3, 1.1],
          ].map(([x, y, z, r], j) => (
            <mesh key={j} position={[x, y, z]} raycast={() => null}>
              <icosahedronGeometry args={[r, 1]} />
              <meshStandardMaterial color="#ffffff" roughness={1} flatShading transparent opacity={0.92} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
