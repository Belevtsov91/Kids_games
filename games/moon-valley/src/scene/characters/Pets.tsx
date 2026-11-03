// Питомцы: лиса Искорка, сова Луна, лягушонок Мох и туманный шар на месте питомца, который ещё не пришёл.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import type { PetKind } from '../../game/valley';
import type { Vec2 } from '../../game/world';
import { useRuntime } from '../../app/runtime';
import { useAnimator, useCharacter } from '../models';
import { turn } from './motion';

/** Лиса Искорка: бежит за героем, садится рядом, подпрыгивает, когда её гладят. */
export function Fox({ happyAt }: { happyAt: number }) {
  const runtime = useRuntime();
  const { object, mixer, clips } = useCharacter('fox', 0.78);
  const anim = useAnimator(mixer, clips);
  const group = useRef<Group>(null);
  const lastHappy = useRef(happyAt);
  const pos = useRef(new Vector3(-1.5, 0, 5));
  const idleSince = useRef(0);
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const g = group.current;
    if (!g) return;
    const hero = runtime.hero;
    const facing = runtime.heroFacing;
    const target = new Vector3(hero.x - Math.sin(facing) * 1.5 + Math.cos(facing) * 0.9, 0, hero.z - Math.cos(facing) * 1.5 - Math.sin(facing) * 0.9);
    const to = target.clone().sub(pos.current);
    to.y = 0;
    const d = to.length();
    if (d > 22) pos.current.copy(target);
    let speed = 0;
    if (d > 2.6) speed = Math.min(9.5, 3 + d * 1.6);
    else if (d > 0.7) speed = 1.8;
    if (speed > 0) {
      pos.current.addScaledVector(to.normalize(), Math.min(d, speed * delta));
      turn(g, Math.atan2(to.x, to.z), delta * 10);
    } else turn(g, Math.atan2(hero.x - pos.current.x, hero.z - pos.current.z), delta * 3);
    g.position.copy(pos.current);
    runtime.pets.set('fox', pos.current);
    if (happyAt !== lastHappy.current) {
      lastHappy.current = happyAt;
      anim.play(['Gallop_Jump'], { once: true, fade: 0.1 });
      idleSince.current = runtime.time + 0.9;
      return;
    }
    if (runtime.time < idleSince.current) return;
    if (speed > 4) anim.play(['Gallop'], { speed: Math.min(1.6, speed / 6) });
    else if (speed > 0) anim.play(['Walk']);
    else anim.play(['Idle']);
  });
  return (
    <group ref={group}>
      <primitive object={object} />
      <Sparkles count={10} scale={[1, 0.9, 1.4]} position={[0, 0.45, 0]} size={2.5} speed={0.5} color="#ffd36b" />
    </group>
  );
}

/** Пушистая Луна: летает над плечом героя. */
export function Owl({ happyAt }: { happyAt: number }) {
  const runtime = useRuntime();
  const { object, mixer, clips } = useCharacter('owl', 0.68);
  const anim = useAnimator(mixer, clips);
  const group = useRef<Group>(null);
  const pos = useRef(new Vector3(2, 2, 5));
  const lastHappy = useRef(happyAt);
  const busyUntil = useRef(0);
  useFrame(({ clock }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const g = group.current;
    if (!g) return;
    const hero = runtime.hero;
    const f = runtime.heroFacing;
    const t = clock.elapsedTime;
    // Справа и чуть впереди героя, выше плеча: камера сзади видит и героя, и сову.
    const target = new Vector3(hero.x - Math.cos(f) * 1.25 + Math.sin(f) * 0.5, hero.y + 2 + Math.sin(t * 2) * 0.12, hero.z + Math.sin(f) * 1.25 + Math.cos(f) * 0.5);
    const d = target.distanceTo(pos.current);
    if (d > 25) pos.current.copy(target);
    pos.current.lerp(target, 1 - Math.exp(-delta * 3));
    g.position.copy(pos.current);
    turn(g, f, delta * 4);
    runtime.pets.set('owl', new Vector3(pos.current.x, 0, pos.current.z));
    if (happyAt !== lastHappy.current) {
      lastHappy.current = happyAt;
      anim.play(['Yes'], { once: true });
      busyUntil.current = runtime.time + 1;
    }
    if (runtime.time < busyUntil.current) return;
    anim.play([d > 1.5 ? 'Fast_Flying' : 'Flying_Idle']);
  });
  return (
    <group ref={group}>
      <primitive object={object} />
      <Sparkles count={8} scale={1.2} position={[0, 0.3, 0]} size={2} color="#d9c8ff" />
    </group>
  );
}

/** Лягушонок Мох: прыгает у грядок. */
export function Frog({ home, happyAt }: { home: Vec2; happyAt: number }) {
  const runtime = useRuntime();
  const { object, mixer, clips } = useCharacter('frog', 0.42);
  const anim = useAnimator(mixer, clips);
  const group = useRef<Group>(null);
  const state = useRef({ x: home[0], z: home[1], tx: home[0], tz: home[1], next: 2 });
  const lastHappy = useRef(happyAt);
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const g = group.current;
    if (!g) return;
    const s = state.current;
    if (runtime.time > s.next) {
      s.tx = home[0] + (Math.random() - 0.5) * 6;
      s.tz = home[1] + (Math.random() - 0.5) * 4;
      s.next = runtime.time + 2.5 + Math.random() * 3;
    }
    const dx = s.tx - s.x;
    const dz = s.tz - s.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.1) {
      s.x += (dx / d) * Math.min(d, 1.6 * delta);
      s.z += (dz / d) * Math.min(d, 1.6 * delta);
      turn(g, Math.atan2(dx, dz), delta * 8);
    }
    g.position.set(s.x, 0, s.z);
    runtime.pets.set('bunny', g.position);
    if (happyAt !== lastHappy.current) {
      lastHappy.current = happyAt;
      anim.play(['Frog_Jump'], { once: true });
      return;
    }
    anim.play([d > 0.1 ? 'Frog_Jump' : 'Frog_Idle']);
  });
  return (
    <group ref={group}>
      <primitive object={object} />
    </group>
  );
}

/** Туманный шар на месте питомца, который ещё не пришёл. */
export function LockedPet({ at, kind }: { at: Vec2; kind: PetKind }) {
  return (
    <group position={[at[0], 1, at[1]]}>
      <mesh>
        <sphereGeometry args={[0.5, 20, 16]} />
        <meshStandardMaterial color="#7d88b3" transparent opacity={0.45} emissive="#5e6aa8" emissiveIntensity={0.4} />
      </mesh>
      <Sparkles count={14} scale={1.6} size={2.4} color={kind === 'owl' ? '#d6c4ff' : '#bff7c2'} />
    </group>
  );
}
