// Живое состояние мира, которое меняется каждый кадр: ввод, позиция героя, камера, сердечки, слаймы.
// Это не React-состояние: сцена читает и пишет его в useFrame без перерисовок. Создаётся на каждый запуск игры.

import { createContext, useContext } from 'react';
import { Vector3 } from 'three';

export interface Input {
  /** Движение: x — вправо, y — вперёд, от -1 до 1 (клавиши или джойстик). */
  moveX: number;
  moveY: number;
  walk: boolean;
  jump: boolean;
}

export type TargetKind = 'plot' | 'npc' | 'crystal' | 'chest' | 'well' | 'pet' | 'greenhouse' | 'boss';
export interface Target {
  kind: TargetKind;
  id: string;
}

export function createRuntime() {
  return {
    input: { moveX: 0, moveY: 0, walk: false, jump: false } as Input,
    keys: new Set<string>(),
    hero: new Vector3(0, 0, 4),
    heroFacing: 0,
    heroSpeed: 0,
    /** Камера: угол вокруг героя и расстояние. */
    camYaw: 0,
    camPitch: 0.42,
    camDist: 9,
    /** Взмах жезлом: номер взмаха растёт, сцена ловит изменение. */
    cast: 0,
    castTime: -10,
    /** Действие героя для анимации (взаимодействие, удар по герою). */
    action: null as null | { name: 'interact' | 'hit' | 'cast' | 'wave'; until: number },
    hearts: 5,
    invulnerableUntil: 0,
    /** Отбросить героя: скорость, которую Hero применит в следующем кадре. */
    knock: null as null | { x: number; z: number; until: number },
    /** Телепорт героя (обморок — домой). */
    teleport: null as null | Vector3,
    /** Когда кристалл собран (id → время), чтобы он вырос снова. */
    crystalTaken: new Map<string, number>(),
    /** Позиции слаймов для подсказок и проверки взмаха. */
    slimes: new Map<string, Vector3>(),
    /** Где сейчас питомцы (для «погладить»). */
    pets: new Map<string, Vector3>(),
    time: 0,
    target: null as Target | null,
    /** Где цель (для подсветки под ней) и её размер. */
    targetAt: new Vector3(),
    targetSize: 1,
  };
}

export type Runtime = ReturnType<typeof createRuntime>;

export const RuntimeContext = createContext<Runtime | null>(null);

export function useRuntime(): Runtime {
  const runtime = useContext(RuntimeContext);
  if (!runtime) throw new Error('RuntimeContext не задан');
  return runtime;
}

export const MAX_HEARTS = 5;
export const CRYSTAL_RESPAWN = 60;
export const SLIME_RESPAWN = 40;
export const CAST_COOLDOWN = 0.55;
export const CAST_RADIUS = 3.6;
