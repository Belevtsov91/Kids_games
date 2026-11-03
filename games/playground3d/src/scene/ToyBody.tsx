import { useMemo, useRef } from 'react';
import { RigidBody, type RapierRigidBody } from '@react-three/rapier';
import type { ThreeEvent } from '@react-three/fiber';
import type { Toy } from '../game/toys';

/** Нажатие считается «тапом», если палец почти не сдвинулся (иначе это поворот камеры). */
const isTap = (event: ThreeEvent<MouseEvent>) => event.delta < 8;

function Shape({ kind, color }: Pick<Toy, 'kind' | 'color'>) {
  return (
    <mesh castShadow receiveShadow>
      {kind === 'ball' && <sphereGeometry args={[0.45, 32, 24]} />}
      {kind === 'cube' && <boxGeometry args={[0.8, 0.8, 0.8]} />}
      {kind === 'ring' && <torusGeometry args={[0.4, 0.18, 16, 32]} />}
      {kind === 'cone' && <coneGeometry args={[0.5, 0.9, 4]} />}
      <meshStandardMaterial color={color} roughness={0.45} />
    </mesh>
  );
}

export function ToyBody({ toy, onBounce }: { toy: Toy; onBounce(): void }) {
  const body = useRef<RapierRigidBody>(null);
  const rotation = useMemo<[number, number, number]>(() => [Math.random() * 3, Math.random() * 3, Math.random() * 3], []);
  return (
    <RigidBody
      ref={body}
      position={toy.position}
      rotation={rotation}
      colliders={toy.kind === 'ball' ? 'ball' : 'hull'}
      restitution={toy.kind === 'ball' ? 0.8 : 0.35}
      friction={0.7}
    >
      <group
        onClick={(event) => {
          if (!isTap(event)) return;
          event.stopPropagation();
          // Подбрасываем игрушку вверх с лёгким случайным вращением.
          const b = body.current;
          if (!b) return;
          const mass = b.mass();
          b.applyImpulse({ x: (Math.random() - 0.5) * 2 * mass, y: 7 * mass, z: (Math.random() - 0.5) * 2 * mass }, true);
          b.applyTorqueImpulse({ x: Math.random() * 0.4 * mass, y: Math.random() * 0.4 * mass, z: 0 }, true);
          onBounce();
        }}
      >
        <Shape kind={toy.kind} color={toy.color} />
      </group>
    </RigidBody>
  );
}

export { isTap };
