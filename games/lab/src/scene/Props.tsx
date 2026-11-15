// Шарик, лампочка, звёздочка и полки уровня.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import type { Level } from '../game/levels/types';
import { SIZE } from '../game/parts';
import type { RunRef } from './PartView';

export function Ball({ level, runRef }: { level: Level; runRef: RunRef }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const run = runRef.current;
    if (!run) {
      g.position.set(level.ball.x, level.ball.y, 0);
      g.quaternion.identity();
      return;
    }
    const p = run.lab.ball.translation();
    const q = run.lab.ball.rotation();
    g.position.set(p.x, p.y, p.z);
    g.quaternion.set(q.x, q.y, q.z, q.w);
  });
  return (
    <group ref={group}>
      <mesh castShadow>
        <sphereGeometry args={[SIZE.ball, 32, 20]} />
        <meshStandardMaterial color="#4f6cf0" roughness={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[SIZE.ball * 0.98, 0.04, 8, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/** Лампочка висит на проводе сверху; горит, когда шарик до неё добрался. */
export function Bulb({ level, lit }: { level: Level; lit: boolean }) {
  const { x, y } = level.bulb;
  const wire = 9.5 - y;
  return (
    <group position={[x, y, 0]}>
      <mesh position={[0, wire / 2 + SIZE.bulb, 0]}>
        <cylinderGeometry args={[0.02, 0.02, wire, 6]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh position={[0, SIZE.bulb + 0.05, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.22, 16]} />
        <meshStandardMaterial color="#8e9196" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh>
        <sphereGeometry args={[SIZE.bulb, 32, 20]} />
        <meshStandardMaterial
          color={lit ? '#fff3a8' : '#f4f1e6'}
          emissive={lit ? '#ffd23f' : '#000000'}
          emissiveIntensity={lit ? 2.2 : 0}
          transparent
          opacity={0.92}
        />
      </mesh>
      {lit && <pointLight color="#ffd86b" intensity={18} distance={7} />}
    </group>
  );
}

export function Star({ level, runRef, still }: { level: Level; runRef: RunRef; still: boolean }) {
  const mesh = useRef<Mesh>(null);
  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    if (!still) m.rotation.y += dt * 1.5;
    const caught = runRef.current?.star ?? false;
    m.scale.setScalar(caught ? 0.0001 : 1);
    (m.material as MeshStandardMaterial).emissiveIntensity = 0.6;
  });
  return (
    <mesh ref={mesh} position={[level.star.x, level.star.y, 0]}>
      <octahedronGeometry args={[SIZE.star * 0.7, 0]} />
      <meshStandardMaterial color="#ffcf33" emissive="#ffb000" emissiveIntensity={0.6} />
    </mesh>
  );
}

export function Shelves({ level }: { level: Level }) {
  return (
    <>
      {level.shelves.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, 0]} rotation={[0, 0, s.angle]} castShadow receiveShadow>
          <boxGeometry args={[s.half * 2, SIZE.plank * 2, 0.8]} />
          <meshStandardMaterial color="#b98552" roughness={0.7} />
        </mesh>
      ))}
    </>
  );
}
