// То, с чем герой взаимодействует на месте: грядки, кристаллы, сундуки, стройка оранжереи.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import type { Group } from 'three';
import { cropOf, GREENHOUSE_COST, type Plot } from '../../game/valley';
import { CRYSTALS, GREENHOUSE_SPOT, PLOTS } from '../../game/world';
import { CRYSTAL_RESPAWN, useRuntime } from '../../app/runtime';
import { Model } from '../models';
import { tr } from '../../i18n';

/** Масштаб, при котором созревшее растение высотой около метра. */
const CROP_SCALE = { corn: 0.62, beet: 1, wheat: 1.25, rice: 1.25 };
const STALKS: [number, number][] = [
  [-0.45, -0.45],
  [0.45, -0.45],
  [-0.45, 0.45],
  [0.45, 0.45],
];

export function Garden({ plots }: { plots: Plot[] }) {
  return (
    <group>
      {plots.map((plot) => {
        const [x, z] = PLOTS[plot.id];
        const crop = cropOf(plot.id);
        const model = plot.stage === 0 ? null : `${crop}-${plot.stage === 1 ? 1 : plot.stage === 2 ? 3 : 4}`;
        const scale = CROP_SCALE[crop] * (plot.stage === 1 ? 1.4 : 1);
        return (
          <group key={plot.id} position={[x, 0, z]}>
            <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
              <boxGeometry args={[2.3, 0.14, 2.3]} />
              <meshStandardMaterial color="#7a5136" roughness={1} />
            </mesh>
            {[-0.55, 0, 0.55].map((row) => (
              <mesh key={row} position={[0, 0.15, row]} receiveShadow>
                <boxGeometry args={[2.05, 0.08, 0.32]} />
                <meshStandardMaterial color="#5e3c27" roughness={1} />
              </mesh>
            ))}
            {model &&
              STALKS.map(([sx, sz], index) => (
                <Model key={index} name={model} position={[sx, 0.14, sz]} rotation={index * 1.7} scale={scale} />
              ))}
            {plot.stage === 3 && <Sparkles count={16} scale={[2.2, 1.6, 2.2]} position={[0, 1, 0]} size={4} color="#fff2a1" />}
            {plot.stage === 0 && <Sparkles count={4} scale={[2, 0.4, 2]} position={[0, 0.3, 0]} size={2} color="#c6ffb8" />}
          </group>
        );
      })}
    </group>
  );
}

function Crystal({ index }: { index: number }) {
  const runtime = useRuntime();
  const group = useRef<Group>(null);
  const [x, z] = CRYSTALS[index];
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const taken = runtime.crystalTaken.get(`c${index}`);
    const visible = taken === undefined || runtime.time - taken > CRYSTAL_RESPAWN;
    if (visible && taken !== undefined) runtime.crystalTaken.delete(`c${index}`);
    g.visible = visible;
    g.rotation.y = clock.elapsedTime * 0.8 + index;
    g.position.y = 0.35 + Math.sin(clock.elapsedTime * 2 + index) * 0.12;
  });
  return (
    <group ref={group} position={[x, 0.35, z]}>
      <Model name="crystal" scale={0.42} shadows={false} />
      <mesh position={[0, 0.35, 0]}>
        <octahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color="#b9f6ff" emissive="#6fd8ff" emissiveIntensity={1.4} transparent opacity={0.55} />
      </mesh>
      <Sparkles count={10} scale={1.4} position={[0, 0.4, 0]} size={3} color="#9ff3ff" />
    </group>
  );
}

export function Crystals() {
  return (
    <>
      {CRYSTALS.map((_, index) => (
        <Crystal key={index} index={index} />
      ))}
    </>
  );
}

export function Chest({ at, rot, opened }: { at: [number, number]; rot: number; opened: boolean }) {
  return (
    <group position={[at[0], 0, at[1]]} rotation-y={rot}>
      <Model name="chest" scale={opened ? 0.85 : 0.95} />
      {!opened && <Sparkles count={20} scale={[1.8, 1.6, 1.8]} position={[0, 0.9, 0]} size={4} color="#ffd75e" />}
    </group>
  );
}

/** Оранжерея: стеклянный купол. Пока не построена — площадка с ящиками и табличкой. */
export function Greenhouse({ built }: { built: boolean }) {
  const [x, z] = GREENHOUSE_SPOT;
  if (!built)
    return (
      <group position={[x, 0, z]}>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
          <ringGeometry args={[2.4, 2.7, 40]} />
          <meshBasicMaterial color="#fff3b0" transparent opacity={0.65} />
        </mesh>
        <Model name="crate" position={[-1, 0, 0.6]} scale={3} />
        <Model name="crate" position={[-0.4, 0, 1.1]} scale={3} rotation={0.5} />
        <Model name="barrel" position={[1, 0, -0.6]} scale={3} />
        <Sparkles count={14} scale={[4, 1.4, 4]} position={[0, 0.6, 0]} size={3} color="#fff0a6" />
        <Html position={[0, 1.8, 0]} center distanceFactor={12} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div className="mv-npc-label">
            <span>{tr().greenhouse} · {GREENHOUSE_COST} ✨</span>
          </div>
        </Html>
      </group>
    );
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
        <cylinderGeometry args={[2.5, 2.6, 0.7, 24]} />
        <meshStandardMaterial color="#e8cfa6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[2.35, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#bdf0ff" transparent opacity={0.42} roughness={0.08} metalness={0.1} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[0, 0.7, 0]} rotation={[0, (i / 6) * Math.PI, 0]}>
          <torusGeometry args={[2.36, 0.04, 6, 32, Math.PI]} />
          <meshStandardMaterial color="#7a5434" />
        </mesh>
      ))}
      <Model name="corn-4" position={[-0.8, 0.7, 0.3]} scale={0.5} />
      <Model name="beet-4" position={[0.7, 0.7, -0.4]} scale={0.8} />
      <Model name="wheat-4" position={[0.2, 0.7, 0.9]} scale={1} />
      <pointLight position={[0, 1.6, 0]} intensity={6} distance={7} color="#ffd98a" />
      <Sparkles count={24} scale={[4, 2.4, 4]} position={[0, 1.6, 0]} size={3} color="#ffe28a" />
    </group>
  );
}
