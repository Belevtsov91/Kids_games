// Теневые слаймы и Грибной король. Их не «убивают»: взмах жезлом возвращает им свет, и они тают искорками.

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import { BOSS_CLEARING, type SlimeSpawn } from '../game/world';
import { CAST_RADIUS, SLIME_RESPAWN, useRuntime, type Runtime } from '../app/runtime';
import { useAnimator, useCharacter } from './models';
import { tr } from '../i18n';

const turn = (group: Group, angle: number, k: number) => {
  let diff = angle - group.rotation.y;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  group.rotation.y += diff * Math.min(1, k);
};

/** Удар по герою: минус сердечко, отбросить, мигание. */
export function hurtHero(runtime: Runtime, fromX: number, fromZ: number, power = 7) {
  if (runtime.time < runtime.invulnerableUntil || runtime.hearts <= 0) return false;
  runtime.hearts -= 1;
  runtime.invulnerableUntil = runtime.time + 1.6;
  const dx = runtime.hero.x - fromX;
  const dz = runtime.hero.z - fromZ;
  const d = Math.hypot(dx, dz) || 1;
  runtime.knock = { x: (dx / d) * power, z: (dz / d) * power, until: runtime.time + 0.22 };
  runtime.action = { name: 'hit', until: runtime.time + 0.35 };
  return true;
}

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

export const BOSS_HP = 10;

/** Грибной король: большой, грустный, топает к герою. Десять взмахов света — и он пляшет. */
export function MushroomKing({ calm, onCalm, onHurt, onHit }: { calm: boolean; onCalm(): void; onHurt(): void; onHit(left: number): void }) {
  const runtime = useRuntime();
  const { object, mixer, clips } = useCharacter('mushroom-king', 3.1);
  const anim = useAnimator(mixer, clips);
  const group = useRef<Group>(null);
  const [hp, setHp] = useState(BOSS_HP);
  const s = useRef({ x: BOSS_CLEARING[0], z: BOSS_CLEARING[1], lastCast: runtime.cast, busyUntil: 0, punchAt: 0 });
  const home = new Vector3(BOSS_CLEARING[0], 0, BOSS_CLEARING[1]);
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const g = group.current;
    if (!g) return;
    const st = s.current;
    const now = runtime.time;
    const hx = runtime.hero.x - st.x;
    const hz = runtime.hero.z - st.z;
    const heroD = Math.hypot(hx, hz);
    if (calm) {
      turn(g, Math.atan2(hx, hz), delta * 2);
      g.position.set(st.x, 0, st.z);
      if (now > st.busyUntil) anim.play(heroD < 8 ? ['Yes', 'Jump_Idle'] : ['Idle']);
      return;
    }
    if (runtime.cast !== st.lastCast) {
      st.lastCast = runtime.cast;
      if (heroD < CAST_RADIUS + 1.4) {
        const left = hp - 1;
        setHp(left);
        onHit(left);
        if (left <= 0) {
          anim.play(['Wave'], { once: true });
          st.busyUntil = now + 2.5;
          onCalm();
          return;
        }
        anim.play(['HitReact'], { once: true, fade: 0.05 });
        st.busyUntil = now + 0.6;
      }
    }
    if (now < st.busyUntil) {
      if (st.punchAt && now >= st.punchAt) {
        st.punchAt = 0;
        if (heroD < 2.6 && hurtHero(runtime, st.x, st.z, 9)) onHurt();
      }
      g.position.set(st.x, 0, st.z);
      return;
    }
    // Ходит только по своей поляне.
    const awake = Math.hypot(runtime.hero.x - home.x, runtime.hero.z - home.z) < 13;
    const tx = awake ? runtime.hero.x : home.x;
    const tz = awake ? runtime.hero.z : home.z;
    const dx = tx - st.x;
    const dz = tz - st.z;
    const d = Math.hypot(dx, dz);
    if (awake && heroD < 2.3) {
      anim.play(['Punch'], { once: true, fade: 0.08 });
      st.busyUntil = now + 1.5;
      st.punchAt = now + 0.45;
    } else if (d > 0.3) {
      const nx = st.x + (dx / d) * 1.5 * delta;
      const nz = st.z + (dz / d) * 1.5 * delta;
      if (Math.hypot(nx - home.x, nz - home.z) < 8) {
        st.x = nx;
        st.z = nz;
      }
      anim.play(['Walk']);
    } else anim.play(['Idle']);
    turn(g, Math.atan2(hx, hz), delta * 3);
    g.position.set(st.x, 0, st.z);
  });
  return (
    <group ref={group} position={[BOSS_CLEARING[0], 0, BOSS_CLEARING[1]]}>
      <primitive object={object} />
      <Sparkles count={calm ? 50 : 24} scale={[4, 4, 4]} position={[0, 1.6, 0]} size={calm ? 6 : 4} color={calm ? '#ffe98a' : '#6c4aa8'} />
      {!calm && (
        <Html position={[0, 3.9, 0]} center distanceFactor={14} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div className="mv-boss-bar">
            <span>{tr().kingSadness}</span>
            <i style={{ width: `${(hp / BOSS_HP) * 100}%` }} />
          </div>
        </Html>
      )}
    </group>
  );
}
