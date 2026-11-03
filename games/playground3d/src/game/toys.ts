// Игрушки песочницы: какие бывают и как их добавлять. Без three.js — это покрывают тесты.

export type ToyKind = 'ball' | 'cube' | 'ring' | 'cone';

export interface Toy {
  id: number;
  kind: ToyKind;
  color: string;
  position: [number, number, number];
}

export const TOY_KINDS: { kind: ToyKind; emoji: string; label: string }[] = [
  { kind: 'ball', emoji: '⚽', label: 'Мячик' },
  { kind: 'cube', emoji: '🧊', label: 'Кубик' },
  { kind: 'ring', emoji: '🍩', label: 'Бублик' },
  { kind: 'cone', emoji: '🔺', label: 'Пирамидка' },
];

export const COLORS = ['#e5484d', '#f76b15', '#ffc53d', '#30a46c', '#0090ff', '#8e4ec6', '#d6409f'];

/** Больше игрушек одновременно не держим: физика на слабых планшетах остаётся плавной. */
export const MAX_TOYS = 40;
/** Половина стороны площадки (игрушки бросаем внутри бортиков). */
export const FIELD = 4.4;

const clamp = (value: number) => Math.max(-FIELD + 0.6, Math.min(FIELD - 0.6, value));

export function makeToy(id: number, kind: ToyKind, x: number, z: number): Toy {
  return { id, kind, color: COLORS[id % COLORS.length], position: [clamp(x), 5, clamp(z)] };
}

/** Новая игрушка в конец; самые старые уходят, если их стало слишком много. */
export function addToy(toys: Toy[], toy: Toy, max = MAX_TOYS): Toy[] {
  const next = [...toys, toy];
  return next.length > max ? next.slice(next.length - max) : next;
}
