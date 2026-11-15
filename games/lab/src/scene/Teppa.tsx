// Медвежонок Тёпа из простых фигур: стоит у края острова и радуется, когда лампа зажглась.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

const FUR = '#c98a4b';
const LIGHT = '#f1d3a8';

function Ball({ p, r, color }: { p: [number, number, number]; r: number; color: string }) {
  return (
    <mesh position={p} castShadow>
      <sphereGeometry args={[r, 24, 16]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}

export function Teppa({ cheer, still }: { cheer: boolean; still: boolean }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g || still) return;
    const t = clock.elapsedTime;
    g.position.y = cheer ? Math.abs(Math.sin(t * 6)) * 0.35 : Math.sin(t * 2) * 0.03;
    g.rotation.y = -0.35 + (cheer ? Math.sin(t * 6) * 0.2 : 0);
  });
  return (
    <group position={[7.9, 0, 1.2]} scale={0.95}>
      <group ref={group} rotation={[0, -0.35, 0]}>
        <Ball p={[0, 0.75, 0]} r={0.62} color={FUR} />
        <Ball p={[0, 0.7, 0.42]} r={0.38} color={LIGHT} />
        <Ball p={[-0.3, 0.15, 0.15]} r={0.22} color={FUR} />
        <Ball p={[0.3, 0.15, 0.15]} r={0.22} color={FUR} />
        <Ball p={[-0.62, 0.95, 0.1]} r={0.18} color={FUR} />
        <Ball p={[0.62, 0.95, 0.1]} r={0.18} color={FUR} />
        <mesh position={[0, 1.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.38, 0.1, 10, 24]} />
          <meshStandardMaterial color="#f27aa0" />
        </mesh>
        <group position={[0, 1.75, 0]}>
          <Ball p={[0, 0, 0]} r={0.5} color={FUR} />
          <Ball p={[-0.38, 0.38, 0]} r={0.17} color={FUR} />
          <Ball p={[0.38, 0.38, 0]} r={0.17} color={FUR} />
          <Ball p={[0, -0.1, 0.42]} r={0.2} color={LIGHT} />
          <Ball p={[0, -0.04, 0.6]} r={0.06} color="#3b2a20" />
          <Ball p={[-0.18, 0.1, 0.44]} r={0.055} color="#2a1d15" />
          <Ball p={[0.18, 0.1, 0.44]} r={0.055} color="#2a1d15" />
          <Ball p={[-0.3, -0.1, 0.36]} r={0.07} color="#ff9fb0" />
          <Ball p={[0.3, -0.1, 0.36]} r={0.07} color="#ff9fb0" />
        </group>
      </group>
    </group>
  );
}
