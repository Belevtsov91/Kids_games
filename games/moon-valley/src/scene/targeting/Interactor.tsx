// Поиск цели рядом с героем: каждые 0,12 с находим ближайшее, с чем можно взаимодействовать, и сообщаем интерфейсу.
// Здесь же идут часы мира (runtime.time) и позиция успокоенного Грибного короля для «поговорить».

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { ValleyState } from '../../game/valley';
import { CHESTS, CRYSTALS, GREENHOUSE_SPOT, NPCS, PLOTS, WELL, type Vec2 } from '../../game/world';
import { useRuntime, type Target } from '../../app/runtime';

/** Размер подсветки под целью. */
const TARGET_SIZE: Record<Target['kind'], number> = {
  plot: 1.25,
  npc: 0.85,
  crystal: 0.7,
  chest: 0.95,
  well: 1.5,
  greenhouse: 2.4,
  pet: 0.6,
  boss: 1.8,
};

/** Каждые 0.12 с ищет ближайшее, с чем можно взаимодействовать, и сообщает интерфейсу. */
export function Interactor({ state, bossCalm, onTarget }: { state: ValleyState; bossCalm: boolean; onTarget(target: Target | null): void }) {
  const runtime = useRuntime();
  const timer = useRef(0);
  const last = useRef('');
  const scene = useThree((three) => three.scene);
  useEffect(() => {
    if (import.meta.env?.DEV) (runtime as { scene?: unknown }).scene = scene;
  }, [runtime, scene]);
  useFrame((_, delta) => {
    runtime.time += Math.min(delta, 0.1);
    timer.current += delta;
    if (timer.current < 0.12) return;
    timer.current = 0;
    const hx = runtime.hero.x;
    const hz = runtime.hero.z;
    let best: Target | null = null;
    let bestD = Infinity;
    let bestX = 0;
    let bestZ = 0;
    const consider = (kind: Target['kind'], id: string, at: Vec2 | { x: number; z: number }, radius: number) => {
      const [x, z] = Array.isArray(at) ? at : [at.x, at.z];
      // Питомцы всё время рядом: уступают жителям и грядкам, если те тоже близко.
      const d = Math.hypot(x - hx, z - hz) + (kind === 'pet' ? 1 : 0);
      if (d < radius && d < bestD) {
        best = { kind, id };
        bestD = d;
        bestX = x;
        bestZ = z;
      }
    };
    PLOTS.forEach((at, i) => consider('plot', String(i), at, 1.9));
    NPCS.forEach((npc) => consider('npc', npc.id, npc.at, 2.8));
    CRYSTALS.forEach((at, i) => {
      if (!runtime.crystalTaken.has(`c${i}`)) consider('crystal', `c${i}`, at, 1.8);
    });
    CHESTS.forEach((chest) => {
      if (!state.opened.includes(chest.id)) consider('chest', chest.id, chest.at, 2.2);
    });
    consider('well', 'well', WELL, 2.6);
    if (!state.buildings.includes('greenhouse')) consider('greenhouse', 'greenhouse', GREENHOUSE_SPOT, 3.2);
    for (const pet of state.pets) {
      const at = runtime.pets.get(pet.id);
      if (pet.unlocked && at) consider('pet', pet.id, at, pet.id === 'owl' ? 3.4 : 2.9);
    }
    if (bossCalm) consider('boss', 'king', { x: runtime.slimes.get('king')?.x ?? 0, z: runtime.slimes.get('king')?.z ?? -31 }, 3.5);
    const key = best ? `${(best as Target).kind}:${(best as Target).id}` : '';
    runtime.target = best;
    if (best) {
      runtime.targetAt.set(bestX, 0, bestZ);
      runtime.targetSize = TARGET_SIZE[(best as Target).kind];
    }
    if (key !== last.current) {
      last.current = key;
      onTarget(best);
    }
  });
  return null;
}

/** Позиция успокоенного короля для «поговорить». Он стоит на поляне. */
export function KingTracker({ active }: { active: boolean }) {
  const runtime = useRuntime();
  useEffect(() => {
    if (active) runtime.slimes.set('king', runtime.hero.clone().set(0, 0, -31));
  }, [active, runtime]);
  return null;
}
