// 3D-долина: остров с озером, грядки, питомцы, волшебное дерево, кристаллы и цветы.
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Float, OrbitControls, Sky, Sparkles, Stars } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import type { Pet, Plot } from '../game/valley';
import { Flower } from './Flower';
import { Greenhouse } from './Greenhouse';
import { PetModel } from './PetModel';
import { Plant } from './Plant';
import { SoftCloud } from './SoftCloud';
import { SceneErrorBoundary } from './SceneErrorBoundary';

const BASE_DISTANCE = 13.2;

/** На узком (портретном) экране камера отъезжает дальше, чтобы остров помещался по ширине. */
function ResponsiveCamera() {
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const distance = Math.min(24, Math.max(BASE_DISTANCE, BASE_DISTANCE * Math.pow(1 / aspect, 0.85)));
  useEffect(() => {
    camera.position.setLength(distance);
    camera.updateProjectionMatrix();
  }, [camera, distance]);
  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      minDistance={distance * 0.55}
      maxDistance={distance + 4}
      maxPolarAngle={1.28}
      minPolarAngle={0.65}
      target={[0, 0, 0]}
    />
  );
}

function Scene({
  plots,
  pets,
  greenhouse,
  night,
  onPlot,
  onPet,
  onCollect,
  paused,
}: {
  plots: Plot[];
  pets: Pet[];
  greenhouse: boolean;
  night: boolean;
  onPlot(id: number): void;
  onPet(id: Pet['id']): void;
  onCollect(): void;
  paused: boolean;
}) {
  const crystals = useMemo(
    () =>
      [
        [-3, 0.35, -1.5],
        [-2.5, 0.25, 2.2],
        [2, 0.35, 2.1],
      ] as [number, number, number][],
    [],
  );
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.7]}
      camera={{ position: [7.2, 6.5, 9], fov: 42 }}
      frameloop={paused ? 'never' : 'always'}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[night ? '#12203e' : '#8fd6ee']} />
      <fog attach="fog" args={[night ? '#12203e' : '#8fd6ee', 12, 32]} />
      <Sky sunPosition={[8, 4, 4]} turbidity={night ? 9 : 7} rayleigh={night ? 0.3 : 1.4} />
      <ambientLight intensity={night ? 0.35 : 0.85} />
      <directionalLight position={[7, 10, 4]} intensity={night ? 0.7 : 2.4} castShadow shadow-mapSize={[1024, 1024]} />
      {night && <Stars radius={40} depth={20} count={900} factor={3} fade speed={0.4} />}
      <SoftCloud position={[-5, 6, -9]} scale={1.3} />
      <SoftCloud position={[6, 7, -11]} speed={0.1} />
      <group rotation={[-0.13, 0.25, 0]}>
        <mesh receiveShadow position={[0, -0.23, 0]}>
          <cylinderGeometry args={[5.5, 6.2, 0.48, 64]} />
          <meshStandardMaterial color="#5d874d" roughness={0.9} />
        </mesh>
        <mesh receiveShadow position={[0, 0.02, 0]}>
          <cylinderGeometry args={[5.42, 5.42, 0.05, 64]} />
          <meshStandardMaterial color="#75b957" roughness={0.95} />
        </mesh>
        <mesh receiveShadow position={[-0.4, 0.07, 0.2]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[1.5, 32]} />
          <meshStandardMaterial color="#a9def5" roughness={0.25} metalness={0.2} />
        </mesh>
        {plots.map((plot, index) => (
          <Plant key={plot.id} plot={plot} position={[index * 1.65 - 1.65, 0.08, -1.3]} onClick={() => onPlot(plot.id)} />
        ))}
        {greenhouse && <Greenhouse />}
        {pets.map((pet, index) => (
          <PetModel key={pet.id} pet={pet} position={[-2.5 + index * 1.25, 0.42, 1.45]} onClick={() => onPet(pet.id)} />
        ))}
        <group position={[0, 0.1, 3]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.55, 0.7, 0.9, 8]} />
            <meshStandardMaterial color="#80553b" />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <coneGeometry args={[0.85, 1.6, 7]} />
            <meshStandardMaterial color="#426f44" />
          </mesh>
          <Sparkles count={26} scale={2.3} size={3} color="#b7f9d0" />
        </group>
        {crystals.map((position, index) => (
          <Float key={index} speed={2} floatIntensity={0.4}>
            <mesh
              position={position}
              castShadow
              onClick={(event) => {
                event.stopPropagation();
                onCollect();
              }}
            >
              <octahedronGeometry args={[0.25, 0]} />
              <meshStandardMaterial color="#9cf7ff" emissive="#66bce0" emissiveIntensity={1.1} />
            </mesh>
          </Float>
        ))}
        {Array.from({ length: 28 }, (_, index) => (
          <Flower
            key={index}
            position={[Math.sin(index * 9) * 4.6, 0.1, Math.cos(index * 7) * 4.4]}
            color={index % 2 ? '#ff88b8' : '#ffe074'}
          />
        ))}
      </group>
      <ContactShadows position={[0, -0.45, 0]} opacity={0.35} scale={18} blur={2.5} far={8} />
      <ResponsiveCamera />
    </Canvas>
  );
}

export function ValleyScene(props: Parameters<typeof Scene>[0]) {
  return (
    <SceneErrorBoundary>
      <Scene {...props} />
    </SceneErrorBoundary>
  );
}
