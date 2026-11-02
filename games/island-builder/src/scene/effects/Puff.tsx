import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import type { Effect } from '../types';

/** Облачко кубиков-искр там, где что-то построили или сломали. */
export function Puff({ effect, onDone }: { effect: Effect; onDone(id: number): void }) {
  const group = useRef<Group>(null);
  const age = useRef(0);
  const finished = useRef(false);
  const parts = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return new Vector3(Math.cos(a) * (1 + Math.random()), 1.5 + Math.random() * 2, Math.sin(a) * (1 + Math.random()));
      }),
    [],
  );
  useFrame((_, dt) => {
    const g = group.current;
    if (!g || finished.current) return;
    age.current += dt;
    const life = age.current / 0.6;
    if (life >= 1) {
      finished.current = true;
      onDone(effect.id);
      return;
    }
    g.children.forEach((child, i) => {
      const v = parts[i];
      child.position.set(v.x * age.current, v.y * age.current - 4.9 * age.current ** 2, v.z * age.current);
      child.scale.setScalar(1 - life);
      child.rotation.x += dt * 6;
      child.rotation.y += dt * 4;
    });
  });
  return (
    <group ref={group} position={effect.pos}>
      {parts.map((_, i) => (
        <mesh key={i} raycast={() => null}>
          <boxGeometry args={[0.16, 0.16, 0.16]} />
          <meshStandardMaterial color={effect.color} />
        </mesh>
      ))}
    </group>
  );
}
