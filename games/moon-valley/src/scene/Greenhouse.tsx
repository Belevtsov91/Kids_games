import { Sparkles } from '@react-three/drei';

/** Оранжерея: открывается по ходу игры. */

export function Greenhouse() {
  return (
    <group position={[2.9, 0.18, -1.9]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.55, 0.36, 1.25]} />
        <meshStandardMaterial color="#f4d8b4" />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.83, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#a7eaff" transparent opacity={0.55} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.28, 0.65]}>
        <boxGeometry args={[0.44, 0.5, 0.04]} />
        <meshStandardMaterial color="#835132" />
      </mesh>
      <Sparkles count={10} scale={2} size={2} color="#ffd66d" />
    </group>
  );
}
