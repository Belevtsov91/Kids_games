// Жители деревни: стоят, поворачиваются к герою, машут при разговоре, над головой — «!» или «?».

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import type { NpcSpot } from '../../game/world';
import { NPC_NAMES } from '../../game/quests';
import { useRuntime } from '../../app/runtime';
import { useAnimator, useCharacter } from '../models';
import { turn } from './motion';

/** Житель: стоит, поворачивается к герою, над головой — «!» или «?». */
export function Npc({ spot, marker, talkAt }: { spot: NpcSpot; marker: '!' | '?' | null; talkAt: number }) {
  const runtime = useRuntime();
  const height = spot.id === 'granny' ? 1.25 : 1.6;
  const { object, mixer, clips } = useCharacter(spot.model, height);
  const anim = useAnimator(mixer, clips);
  const group = useRef<Group>(null);
  const lastTalk = useRef(talkAt);
  const busyUntil = useRef(0);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const dx = runtime.hero.x - spot.at[0];
    const dz = runtime.hero.z - spot.at[1];
    const near = Math.hypot(dx, dz) < 6;
    turn(g, near ? Math.atan2(dx, dz) : spot.rot, delta * 4);
    if (talkAt !== lastTalk.current) {
      lastTalk.current = talkAt;
      anim.play(['Wave', 'emote-yes', 'Man_Clapping'], { once: true, fade: 0.15 });
      busyUntil.current = runtime.time + 1.6;
    }
    if (runtime.time < busyUntil.current) return;
    anim.play(['Idle', 'idle', 'Man_Idle']);
  });
  return (
    <group ref={group} position={[spot.at[0], 0, spot.at[1]]} rotation-y={spot.rot}>
      <primitive object={object} />
      <Html position={[0, height + 0.55, 0]} center distanceFactor={12} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className="mv-npc-label">
          {marker && <b className={marker === '!' ? 'offer' : 'ready'}>{marker}</b>}
          <span>{NPC_NAMES[spot.id]}</span>
        </div>
      </Html>
    </group>
  );
}
