// Облако из нескольких шаров: без текстур из интернета, поэтому работает и офлайн.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

const PUFFS: [number, number, number, number][] = [
  [0, 0, 0, 1],
  [1.1, -0.15, 0.1, 0.8],
  [-1.1, -0.2, 0, 0.75],
  [0.45, 0.45, -0.1, 0.7],
  [-0.5, 0.35, 0.15, 0.6],
];

export function SoftCloud({ position, scale = 1, speed = 0.15 }: { position: [number, number, number]; scale?: number; speed?: number }) {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (group.current) group.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * speed) * 1.2;
  });
  return (
    <group ref={group} position={position} scale={scale}>
      {PUFFS.map(([x, y, z, r], index) => (
        <mesh key={index} position={[x, y, z]}>
          <sphereGeometry args={[r, 16, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}
