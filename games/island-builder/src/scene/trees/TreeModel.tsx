// Модели растений из простых фигур: пальма, ель, дуб и клумба.
import type { ReactNode } from 'react';
import type { TreeKind } from '../../game/world';

export function TreeModel({ kind }: { kind: TreeKind }): ReactNode {
  switch (kind) {
    case 'palm':
      return (
        <>
          <mesh castShadow position={[0.08, 0.7, 0]} rotation={[0, 0, -0.12]}>
            <cylinderGeometry args={[0.07, 0.11, 1.4, 6]} />
            <meshStandardMaterial color="#a0794a" roughness={0.9} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <group key={i} position={[0.16, 1.42, 0]} rotation={[0, (i / 6) * Math.PI * 2, 0]}>
              <mesh castShadow position={[0, -0.12, 0.42]} rotation={[0.45, 0, 0]} scale={[1, 0.12, 1]}>
                <boxGeometry args={[0.28, 1, 0.9]} />
                <meshStandardMaterial color={i % 2 ? '#3fae4a' : '#4cc257'} roughness={0.8} flatShading />
              </mesh>
            </group>
          ))}
          <mesh position={[0.16, 1.32, 0.1]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshStandardMaterial color="#7a4e24" />
          </mesh>
        </>
      );
    case 'pine':
      return (
        <>
          <mesh castShadow position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.5, 6]} />
            <meshStandardMaterial color="#7a5230" />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} castShadow position={[0, 0.65 + i * 0.38, 0]}>
              <coneGeometry args={[0.55 - i * 0.14, 0.7, 7]} />
              <meshStandardMaterial color={i === 2 ? '#2f9a55' : '#24804a'} roughness={0.85} flatShading />
            </mesh>
          ))}
        </>
      );
    case 'round':
      return (
        <>
          <mesh castShadow position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.09, 0.13, 0.7, 6]} />
            <meshStandardMaterial color="#8a5a33" />
          </mesh>
          <mesh castShadow position={[0, 1.0, 0]}>
            <icosahedronGeometry args={[0.5, 1]} />
            <meshStandardMaterial color="#4cbb4c" roughness={0.8} flatShading />
          </mesh>
          <mesh castShadow position={[0.22, 1.25, 0.1]}>
            <icosahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color="#5fd15a" roughness={0.8} flatShading />
          </mesh>
        </>
      );
    case 'flowers':
      return (
        <>
          {[
            [-0.2, -0.15, '#ff5c8a'],
            [0.18, -0.1, '#ffd23f'],
            [0, 0.2, '#b27cff'],
            [-0.15, 0.22, '#ff8c42'],
            [0.22, 0.2, '#ff5c8a'],
          ].map(([x, z, color], i) => (
            <group key={i} position={[x as number, 0, z as number]}>
              <mesh position={[0, 0.14, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.28, 4]} />
                <meshStandardMaterial color="#3c9a3c" />
              </mesh>
              <mesh castShadow position={[0, 0.3, 0]}>
                <icosahedronGeometry args={[0.08, 0]} />
                <meshStandardMaterial color={color as string} emissive={color as string} emissiveIntensity={0.15} flatShading />
              </mesh>
            </group>
          ))}
        </>
      );
  }
}
