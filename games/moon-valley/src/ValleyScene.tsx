import { Canvas, useFrame } from '@react-three/fiber';
import { Cloud, ContactShadows, Float, OrbitControls, Sky, Sparkles, Stars } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { Group, type ColorRepresentation } from 'three';
import type { Pet, Plot } from './game';

function Flower({ position, color }: { position: [number, number, number]; color: ColorRepresentation }) {
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

function Plant({ plot, position, onClick }: { plot: Plot; position: [number, number, number]; onClick(): void }) {
  const colors = ['#826c44', '#74d96d', '#ff8dbc', '#b9f8ff'];
  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 24]} />
        <meshStandardMaterial color="#6b5135" />
      </mesh>
      {plot.stage > 0 && (
        <mesh castShadow position={[0, 0.18 * plot.stage, 0]}>
          <coneGeometry args={[0.12 + plot.stage * 0.09, 0.35 * plot.stage, 8]} />
          <meshStandardMaterial
            color={colors[plot.stage]}
            emissive={plot.stage === 3 ? colors[plot.stage] : '#000'}
            emissiveIntensity={0.35}
          />
        </mesh>
      )}
      {plot.stage === 3 && (
        <Float speed={2} floatIntensity={0.35}>
          <Flower position={[0, 0.85, 0]} color="#d987ff" />
        </Float>
      )}
    </group>
  );
}

function PetModel({ pet, position, onClick }: { pet: Pet; position: [number, number, number]; onClick(): void }) {
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

function Greenhouse() {
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

function Scene({
  plots,
  pets,
  greenhouse,
  night,
  onPlot,
  onPet,
  onCollect,
}: {
  plots: Plot[];
  pets: Pet[];
  greenhouse: boolean;
  night: boolean;
  onPlot(id: number): void;
  onPet(id: Pet['id']): void;
  onCollect(): void;
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
      shadows
      dpr={[1, 1.7]}
      camera={{ position: [7.2, 6.5, 9], fov: 42 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[night ? '#12203e' : '#8fd6ee']} />
      <fog attach="fog" args={[night ? '#12203e' : '#8fd6ee', 12, 32]} />
      <Sky sunPosition={[8, 4, 4]} turbidity={night ? 9 : 7} rayleigh={night ? 0.3 : 1.4} />
      <ambientLight intensity={night ? 0.35 : 0.85} />
      <directionalLight position={[7, 10, 4]} intensity={night ? 0.7 : 2.4} castShadow shadow-mapSize={[1024, 1024]} />
      {night && <Stars radius={40} depth={20} count={900} factor={3} fade speed={0.4} />}
      <Cloud position={[-5, 6, -9]} opacity={0.45} speed={0.15} />
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
      <OrbitControls makeDefault minDistance={7} maxDistance={14} maxPolarAngle={1.28} minPolarAngle={0.65} target={[0, 0, 0]} />
    </Canvas>
  );
}

export function ValleyScene(props: Parameters<typeof Scene>[0]) {
  return <Scene {...props} />;
}
