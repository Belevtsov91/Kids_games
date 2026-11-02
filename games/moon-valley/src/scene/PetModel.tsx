// Питомец: лисёнок, совёнок или зайка. Пока не приручён — туманный шар с искрами.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import type { Group } from 'three';
import type { Pet } from '../game/valley';

export function PetModel({ pet, position, onClick }: { pet: Pet; position: [number, number, number]; onClick(): void }) {
  const group = useRef<Group>(null);
  const color = pet.id === 'fox' ? '#ef8c42' : pet.id === 'owl' ? '#a58ee5' : '#e7eff0';
  useFrame((state) => {
    if (group.current) group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05;
  });
  if (!pet.unlocked)
    return (
      <group position={position}>
        <mesh>
          <sphereGeometry args={[0.46, 16, 16]} />
          <meshStandardMaterial color="#68748e" transparent opacity={0.55} />
        </mesh>
        <Sparkles count={8} scale={1.4} size={2} color="#b7c4f8" />
      </group>
    );
  return (
    <group
      ref={group}
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <mesh castShadow>
        <sphereGeometry args={[0.38, 18, 18]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh castShadow position={[0, 0.32, 0.02]} scale={[0.88, 0.8, 0.88]}>
        <sphereGeometry args={[0.29, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {pet.id === 'fox' &&
        [-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.18, 0.62, 0]} rotation={[0, 0, side * -0.25]}>
            <coneGeometry args={[0.13, 0.35, 3]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))}
      {pet.id === 'owl' &&
        [-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.16, 0.4, 0.24]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshStandardMaterial color="#ffe66c" emissive="#ffe66c" />
          </mesh>
        ))}
      {pet.id === 'bunny' &&
        [-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.13, 0.62, 0]} scale={[0.55, 1.5, 0.55]}>
            <sphereGeometry args={[0.11, 10, 10]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))}
      <mesh position={[-0.11, 0.36, 0.27]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="#263152" />
      </mesh>
      <mesh position={[0.11, 0.36, 0.27]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="#263152" />
      </mesh>
      <Sparkles count={pet.affection > 0 ? 12 : 3} scale={1.1} size={2} color="#ffe387" />
    </group>
  );
}
