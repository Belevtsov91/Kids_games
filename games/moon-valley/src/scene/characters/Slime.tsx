// Теневой слайм. Его не «убивают»: взмах жезлом рядом возвращает ему свет, он тает искорками и позже появляется снова.

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import type { Group } from 'three';
import type { SlimeSpawn } from '../../game/world';
import { CAST_RADIUS, SLIME_RESPAWN, useRuntime } from '../../app/runtime';
import { useAnimator, useCharacter } from '../models';
import { hurtHero, turn } from './motion';

export function Slime({ spawn, onCleanse, onHurt }: { spawn: SlimeSpawn; onCleanse(big: boolean): void; onHurt(): void }) {
  const runtime = useRuntime();
  const big = spawn.kind === 'imp';
  const { object, mixer, clips } = useCharacter(spawn.kind, big ? 1.15 : 0.85);
  const anim = useAnimator(mixer, clips);
  const group = useRef<Group>(null);
  const [glow, setGlow] = useState(false);
  const s = useRef({
    x: spawn.at[0],
    z: spawn.at[1],
    tx: spawn.at[0],
    tz: spawn.at[1],
    mode: 'wander' as 'wander' | 'chase' | 'melt' | 'gone',
    until: 0,
    next: 0,
    lastCast: runtime.cast,
    biteUntil: 0,
  });
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const g = group.current;
    if (!g) return;
    const st = s.current;
    const now = runtime.time;
    if (st.mode === 'gone') {
      if (now < st.until) return;
      st.mode = 'wander';
      st.x = spawn.at[0];
      st.z = spawn.at[1];
      g.visible = true;
      g.scale.setScalar(1);
      setGlow(false);
    }
    if (st.mode === 'melt') {
      const k = Math.max(0, (st.until - now) / 1.2);
      g.scale.setScalar(0.2 + k * 0.8);
      g.position.y = (1 - k) * 0.8;
      if (now >= st.until) {
        st.mode = 'gone';
        st.until = now + SLIME_RESPAWN;
        g.visible = false;
      }
      return;
    }
    const hx = runtime.hero.x - st.x;
    const hz = runtime.hero.z - st.z;
    const heroD = Math.hypot(hx, hz);
    // Взмах жезлом рядом — слайм очищен.
    if (runtime.cast !== st.lastCast) {
      st.lastCast = runtime.cast;
      if (heroD < CAST_RADIUS) {
        st.mode = 'melt';
        st.until = now + 1.2;
        runtime.slimes.delete(spawn.id);
        anim.play(['Yes', 'Dance'], { once: true, fade: 0.1 });
        setGlow(true);
        onCleanse(big);
        return;
      }
    }
    let speed = 0.9;
    if (heroD < 7.5 && runtime.hearts > 0) {
      st.mode = 'chase';
      st.tx = runtime.hero.x;
      st.tz = runtime.hero.z;
      speed = big ? 2.2 : 1.9;
    } else {
      st.mode = 'wander';
      if (now > st.next || Math.hypot(st.tx - st.x, st.tz - st.z) < 0.3) {
        st.tx = spawn.at[0] + (Math.random() - 0.5) * 8;
        st.tz = spawn.at[1] + (Math.random() - 0.5) * 8;
        st.next = now + 3 + Math.random() * 3;
      }
    }
    const dx = st.tx - st.x;
    const dz = st.tz - st.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.75 && now > st.biteUntil) {
      st.x += (dx / d) * speed * delta;
      st.z += (dz / d) * speed * delta;
    }
    if (d > 0.05) turn(g, Math.atan2(dx, dz), delta * 6);
    g.position.set(st.x, 0, st.z);
    runtime.slimes.set(spawn.id, g.position);
    if (heroD < (big ? 1.1 : 0.9) && hurtHero(runtime, st.x, st.z)) {
      st.biteUntil = now + 0.6;
      anim.play(['Bite_Front'], { once: true, fade: 0.05 });
      onHurt();
      return;
    }
    if (now < st.biteUntil) return;
    anim.play([d > 0.75 ? 'Walk' : 'Idle'], { speed: st.mode === 'chase' ? 1.4 : 1 });
  });
  return (
    <group ref={group} position={[spawn.at[0], 0, spawn.at[1]]}>
      <primitive object={object} />
      {glow ? (
        <Sparkles count={40} scale={2.2} position={[0, 0.6, 0]} size={5} speed={1.5} color="#fff6b0" />
      ) : (
        <Sparkles count={10} scale={[1.2, 1, 1.2]} position={[0, 0.5, 0]} size={3} speed={0.3} color="#5b3d8f" opacity={0.8} />
      )}
    </group>
  );
}
