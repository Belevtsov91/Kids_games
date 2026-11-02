export function BoatModel({ color }: { color: string }) {
  return (
    <>
      <mesh castShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[0.9, 0.3, 1.8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, -0.05, 1.0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.636, 0.3, 0.636]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[0.78, 0.04, 1.65]} />
        <meshStandardMaterial color="#d9a066" />
      </mesh>
      <mesh castShadow position={[0, 0.25, -0.45]}>
        <boxGeometry args={[0.55, 0.3, 0.5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh castShadow position={[0, 0.8, 0.2]}>
        <cylinderGeometry args={[0.035, 0.035, 1.4, 6]} />
        <meshStandardMaterial color="#7a5230" />
      </mesh>
      <mesh castShadow position={[0.02, 0.85, 0.42]} rotation={[0, Math.PI / 2, 0]} scale={[1, 1, 0.06]}>
        <coneGeometry args={[0.45, 1.1, 3]} />
        <meshStandardMaterial color="#fffaf0" side={2} />
      </mesh>
    </>
  );
}
