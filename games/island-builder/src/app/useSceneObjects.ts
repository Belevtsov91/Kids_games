import { useRef, useState } from 'react';
import { cellToWorld, type Cell } from '../game/world';
import type { Effect, Floater, Vec3 } from '../scene/types';

// Временные объекты сцены, которых нет в сохранении: лодки, ящики и облачка-искры.

const MAX_BOATS = 10;
const MAX_CRATES = 16;
const MAX_EFFECTS = 12;
const BOAT_COLORS = ['#e5484d', '#3e8ef7', '#f5a524', '#8e4ec6', '#12a594', '#ff7eb6'];

const randomItem = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

export function useSceneObjects() {
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [effects, setEffects] = useState<Effect[]>([]);
  const nextId = useRef(1);

  /** Облачко искр там, где что-то построили или сломали. */
  const puff = (cell: Cell, color: string) => {
    setEffects((list) => [...list.slice(-MAX_EFFECTS), { id: nextId.current++, pos: cellToWorld(cell), color }]);
  };

  const spawn = (kind: Floater['kind'], pos: Vec3) => {
    const limit = kind === 'boat' ? MAX_BOATS : MAX_CRATES;
    const floater: Floater = { id: nextId.current++, kind, pos, rot: Math.random() * Math.PI * 2, color: randomItem(BOAT_COLORS) };
    setFloaters((list) => {
      const same = list.filter((f) => f.kind === kind);
      // Старые лодки и ящики уплывают, чтобы сцена не тормозила.
      const drop = same.length >= limit ? same[0].id : null;
      return [...list.filter((f) => f.id !== drop), floater];
    });
  };

  return {
    floaters,
    effects,
    puff,
    spawn,
    clearFloaters: () => setFloaters([]),
    removeFloater: (id: number) => setFloaters((list) => list.filter((f) => f.id !== id)),
    removeEffect: (id: number) => setEffects((list) => list.filter((e) => e.id !== id)),
  };
}

export type SceneObjects = ReturnType<typeof useSceneObjects>;
