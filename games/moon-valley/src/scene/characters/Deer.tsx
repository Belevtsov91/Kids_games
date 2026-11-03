// Олени у озера: пасутся и убегают, если герой подходит слишком близко.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { Vec2 } from '../../game/world';
import { useRuntime } from '../../app/runtime';
import { useAnimator, useCharacter } from '../models';
import { turn } from './motion';

/** Олень у озера: пасётся и убегает, если подойти слишком близко. */
export function Deer({ home }: { home: Vec2 }) {
  const runtime = useRuntime();
  const { object, mixer, clips } = useCharacter('deer', 1.5);
  const anim = useAnimator(mixer, clips);
  const group = useRef<Group>(null);
  const s = useRef({ x: home[0], z: home[1], tx: home[0], tz: home[1], next: 0, eating: false });
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const g = group.current;
    if (!g) return;
    const st = s.current;
    const hx = runtime.hero.x - st.x;
    const hz = runtime.hero.z - st.z;
    const heroD = Math.hypot(hx, hz);
    let speed = 1.1;
    if (heroD < 4.5) {
      st.tx = st.x - (hx / heroD) * 6;
      st.tz = st.z - (hz / heroD) * 6;
      st.next = runtime.time + 3;
      speed = 6;
    } else if (runtime.time > st.next) {
      st.eating = Math.random() < 0.5;
      st.tx = home[0] + (Math.random() - 0.5) * 8;
      st.tz = home[1] + (Math.random() - 0.5) * 8;
      st.next = runtime.time + 4 + Math.random() * 4;
    }
    // Не убегать за пределы луга.
    if (Math.hypot(st.tx - home[0], st.tz - home[1]) > 9) {
      st.tx = home[0];
      st.tz = home[1];
    }
    const dx = st.tx - st.x;
    const dz = st.tz - st.z;
    const d = Math.hypot(dx, dz);
    const moving = d > 0.2 && !(st.eating && speed < 2);
    if (moving) {
      st.x += (dx / d) * Math.min(d, speed * delta);
      st.z += (dz / d) * Math.min(d, speed * delta);
      turn(g, Math.atan2(dx, dz), delta * 6);
    }
    g.position.set(st.x, 0, st.z);
    if (moving) anim.play([speed > 3 ? 'Gallop' : 'Walk']);
    else anim.play([st.eating ? 'Eating' : 'Idle']);
  });
  return (
    <group ref={group}>
      <primitive object={object} />
    </group>
  );
}
