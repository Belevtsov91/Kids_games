export function CrateModel() {
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#c98b47" roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0, s * 0.405]}>
          <boxGeometry args={[0.82, 0.14, 0.02]} />
          <meshStandardMaterial color="#8a5a2b" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`x${s}`} position={[s * 0.405, 0, 0]}>
          <boxGeometry args={[0.02, 0.14, 0.82]} />
          <meshStandardMaterial color="#8a5a2b" />
        </mesh>
      ))}
    </>
  );
}
