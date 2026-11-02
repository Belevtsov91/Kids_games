import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';

// Заготовка для будущих 3D-игр: сцена, свет, физика.
export default function Playground3D() {
  return (
    <Canvas shadows camera={{ position: [4, 4, 6], fov: 50 }} style={{ position: 'absolute', inset: 0 }}>
      <color attach="background" args={['#bfe3ff']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <Physics>
        <RigidBody position={[0, 4, 0]} colliders="ball" restitution={0.7}>
          <mesh castShadow>
            <sphereGeometry args={[0.6, 32, 32]} />
            <meshStandardMaterial color="#e5484d" />
          </mesh>
        </RigidBody>
        <RigidBody type="fixed">
          <mesh receiveShadow position={[0, -0.25, 0]}>
            <boxGeometry args={[10, 0.5, 10]} />
            <meshStandardMaterial color="#30a46c" />
          </mesh>
        </RigidBody>
      </Physics>
      <OrbitControls />
    </Canvas>
  );
}
