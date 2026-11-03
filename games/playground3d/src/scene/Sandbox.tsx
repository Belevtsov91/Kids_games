import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import { FIELD, type Toy } from '../game/toys';
import { isTap, ToyBody } from './ToyBody';

interface Props {
  toys: Toy[];
  paused: boolean;
  onDrop(x: number, z: number): void;
  onBounce(): void;
}

const WALL = 0.5;
const BASE_DISTANCE = 14.6;

/** На портретном экране камера отъезжает, чтобы площадка помещалась по ширине. */
function Camera() {
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const distance = Math.min(34, Math.max(BASE_DISTANCE, BASE_DISTANCE * Math.pow(1.5 / aspect, 0.9)));
  useEffect(() => {
    camera.position.setLength(distance);
    camera.updateProjectionMatrix();
  }, [camera, distance]);
  return <OrbitControls makeDefault enablePan={false} minDistance={distance * 0.6} maxDistance={distance * 1.5} maxPolarAngle={1.35} />;
}

/** Площадка с бортиками: игрушки не скатываются в пустоту. */
function Field({ onDrop }: Pick<Props, 'onDrop'>) {
  const walls: [number, number, number, number, number][] = [
    [0, FIELD, FIELD + WALL / 2, WALL / 2, 0],
    [0, -FIELD, FIELD + WALL / 2, WALL / 2, 0],
    [FIELD, 0, WALL / 2, FIELD + WALL / 2, 1],
    [-FIELD, 0, WALL / 2, FIELD + WALL / 2, 1],
  ];
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[FIELD, 0.25, FIELD]} position={[0, -0.25, 0]} />
      <mesh
        receiveShadow
        position={[0, -0.25, 0]}
        onClick={(event) => {
          if (!isTap(event)) return;
          event.stopPropagation();
          onDrop(event.point.x, event.point.z);
        }}
      >
        <boxGeometry args={[FIELD * 2, 0.5, FIELD * 2]} />
        <meshStandardMaterial color="#30a46c" />
      </mesh>
      {walls.map(([x, z, hx, hz], index) => (
        <group key={index} position={[x, 0.3, z]}>
          <CuboidCollider args={[hx, 0.6, hz]} />
          <mesh castShadow receiveShadow>
            <boxGeometry args={[hx * 2, 1.2, hz * 2]} />
            <meshStandardMaterial color="#f5d90a" />
          </mesh>
        </group>
      ))}
    </RigidBody>
  );
}

export function Sandbox({ toys, paused, onDrop, onBounce }: Props) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      frameloop={paused ? 'never' : 'always'}
      camera={{ position: [7, 8, 10], fov: 45 }}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
    >
      <color attach="background" args={['#bfe3ff']} />
      <hemisphereLight args={['#ffffff', '#88aa88', 0.8]} />
      <directionalLight position={[5, 10, 5]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]}>
        <orthographicCamera attach="shadow-camera" args={[-7, 7, 7, -7, 0.5, 30]} />
      </directionalLight>
      <Physics paused={paused}>
        <Field onDrop={onDrop} />
        {toys.map((toy) => (
          <ToyBody key={toy.id} toy={toy} onBounce={onBounce} />
        ))}
      </Physics>
      <Camera />
    </Canvas>
  );
}
