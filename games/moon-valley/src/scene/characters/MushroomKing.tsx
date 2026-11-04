// Грибной король (босс): большой, грустный, топает к герою. Десять взмахов света — и он пляшет.

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import { BOSS_CLEARING } from '../../game/world';
import { CAST_RADIUS, useRuntime } from '../../app/runtime';
import { useAnimator, useCharacter } from '../models';
import { tr } from '../../i18n';
import { hurtHero, turn } from './motion';

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
