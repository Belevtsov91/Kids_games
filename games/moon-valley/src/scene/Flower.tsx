import type { ColorRepresentation } from 'three';

/** Цветок из пяти лепестков. */

export function Flower({ position, color }: { position: [number, number, number]; color: ColorRepresentation }) {
  return (
    <group position={position}>
      {[0, 1, 2, 3, 4].map((index) => (
        <mesh
          key={index}
          rotation={[0, (index / 5) * Math.PI * 2, 0.7]}
          position={[Math.cos(index * 1.26) * 0.13, 0.14, Math.sin(index * 1.26) * 0.13]}
        >
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} />
        </mesh>
      ))}
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffd35f" />
      </mesh>
    </group>
  );
}
