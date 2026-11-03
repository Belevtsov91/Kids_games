// Карта долины: где стоят дома, деревья, грядки, жители, кристаллы, сундуки и где бродят слаймы.
// Только данные (метры, вид сверху: x — восток, z — юг). Сцена расставляет по ним модели и коллайдеры.

import type { NpcId } from './quests';

export type Vec2 = [x: number, z: number];

export const ISLAND_RADIUS = 44;
/** Дальше этого радиуса герой не уходит (край острова). */
export const WALK_RADIUS = 39;
export const HERO_SPAWN: Vec2 = [0, 4];
export const HOME: Vec2 = [0, -13];
export const LAKE = { center: [-19, 7] as Vec2, radius: 7.5 };
export const BOSS_CLEARING: Vec2 = [0, -31];
export const GREENHOUSE_SPOT: Vec2 = [9, -11];
export const WELL: Vec2 = [15, 1];

export const PLOTS: Vec2[] = [
  [-3.2, -6.5],
  [0, -6.5],
  [3.2, -6.5],
  [-3.2, -3.3],
  [0, -3.3],
  [3.2, -3.3],
];

export interface Placed {
  model: string;
  at: Vec2;
  /** Поворот вокруг вертикали, радианы. */
  rot?: number;
  scale?: number;
  /** Коллайдер: круг радиуса r или прямоугольник w×d (в метрах, уже с учётом scale). */
  collider?: { r: number } | { w: number; d: number };
}

const B = 1.65; // масштаб домиков: в паке они под маленького человечка

/** Дома: коллайдер сцена строит по настоящим габаритам модели. */
export const BUILDINGS: Placed[] = [
  { model: 'house-1', at: HOME, rot: 0, scale: B },
  { model: 'inn', at: [19, -9], rot: -Math.PI / 2, scale: B },
  { model: 'house-2', at: [16, 10], rot: Math.PI, scale: B },
  { model: 'house-3', at: [25, 3], rot: -Math.PI / 2, scale: B },
  { model: 'stable', at: [24, 17], rot: Math.PI, scale: B },
  { model: 'mill', at: [29, -19], rot: -Math.PI / 3, scale: B },
  { model: 'bell-tower', at: [8, 15], rot: Math.PI, scale: B },
];

export const PROPS: Placed[] = [
  { model: 'well', at: WELL, scale: 2.2, collider: { r: 1.2 } },
  { model: 'marketstand-1', at: [21, -1], rot: -Math.PI / 2, scale: 2.4, collider: { w: 2.4, d: 2.8 } },
  { model: 'marketstand-2', at: [21, 3.2], rot: -Math.PI / 2, scale: 2.4, collider: { w: 1.6, d: 2.8 } },
  { model: 'bonfire-lit', at: [11, 5], scale: 2.4, collider: { r: 0.6 } },
  { model: 'bench-1', at: [11, 7.2], rot: Math.PI, scale: 2.6 },
  { model: 'bench-1', at: [11, 2.8], scale: 2.6 },
  { model: 'cart', at: [24, -3], rot: 0.4, scale: 2.4, collider: { r: 1.2 } },
  { model: 'hay', at: [27, 12], scale: 3 },
  { model: 'hay', at: [28, 13], scale: 3 },
  { model: 'barrel', at: [16, -3.5], scale: 3 },
  { model: 'barrel', at: [16.7, -3.2], scale: 3 },
  { model: 'crate', at: [16.2, -4.3], scale: 3 },
  { model: 'cauldron', at: [-6.5, -9.5], scale: 2.4 },
  { model: 'gazebo', at: [-11, 15], rot: 0.5, scale: 2.4, collider: { r: 1.4 } },
  { model: 'campfire', at: [-9, -17], scale: 2.4 },
  { model: 'log', at: [-10.5, -18], rot: 0.6, scale: 1.6 },
];

/** Забор вокруг сада: отрезки «от — до». */
export const FENCES: [Vec2, Vec2][] = [
  [[-5.5, -8.5], [5.5, -8.5]],
  [[-5.5, -8.5], [-5.5, -1]],
  [[5.5, -8.5], [5.5, -1]],
];

export interface NpcSpot {
  id: NpcId;
  model: string;
  at: Vec2;
  rot: number;
}
export const NPCS: NpcSpot[] = [
  { id: 'granny', model: 'npc-granny', at: [-7, -5], rot: 0.9 },
  { id: 'miller', model: 'npc-miller', at: [24.5, -13.5], rot: -2.4 },
  { id: 'ranger', model: 'npc-ranger', at: [-9, -14], rot: 0.6 },
];

export const CRYSTALS: Vec2[] = [
  [-13, -4],
  [-27, 0],
  [-24, 16],
  [-4, 22],
  [6, 25],
  [33, 6],
  [14, -20],
  [-17, -24],
  [-30, -13],
  [3, -22],
  [-12, 27],
  [30, -6],
];

export const CHESTS: { id: string; at: Vec2; rot: number }[] = [
  { id: 'lake', at: [-31, 12], rot: 1.2 },
  { id: 'stable', at: [32, 20], rot: -2.2 },
  { id: 'forest', at: [-24, -30], rot: 0.5 },
];

export interface SlimeSpawn {
  id: string;
  at: Vec2;
  kind: 'slime' | 'slime-pink' | 'imp';
}
export const SLIMES: SlimeSpawn[] = [
  { id: 's1', at: [-14, -12], kind: 'slime' },
  { id: 's2', at: [-20, -16], kind: 'slime-pink' },
  { id: 's3', at: [-26, -8], kind: 'slime' },
  { id: 's4', at: [-16, -22], kind: 'imp' },
  { id: 's5', at: [-28, -22], kind: 'slime-pink' },
  { id: 's6', at: [-8, -24], kind: 'slime' },
  { id: 's7', at: [-30, 4], kind: 'imp' },
  { id: 's8', at: [10, -26], kind: 'slime' },
  { id: 's9', at: [-6, 26], kind: 'slime-pink' },
];

export const DEER: Vec2[] = [
  [-26, 18],
  [-10, 12],
];

/** Детерминированный генератор: одинаковый лес при каждом запуске. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const dist = (a: Vec2, b: Vec2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Места, где деревьям расти нельзя: дома, сад, деревня, дорожки, озеро, поляна. */
const CLEAR: { at: Vec2; r: number }[] = [
  { at: [0, -6], r: 11 },
  { at: HOME, r: 6 },
  { at: [0, 4], r: 6 },
  { at: [19, 2], r: 15 },
  { at: [26, -16], r: 7 },
  { at: [8, 15], r: 5 },
  { at: [24, 17], r: 8 },
  { at: LAKE.center, r: LAKE.radius + 2.5 },
  { at: BOSS_CLEARING, r: 8 },
  { at: GREENHOUSE_SPOT, r: 4 },
  { at: [-11, 15], r: 3 },
  { at: [-9, -16], r: 3.5 },
  ...CRYSTALS.map((at) => ({ at, r: 1.6 })),
  ...CHESTS.map((c) => ({ at: c.at, r: 2 })),
];

/** Дорожки: от дома к деревне, к лесу, к поляне. Деревья на них не растут. */
export const PATHS: Vec2[][] = [
  [[0, -1], [6, 0], [12, 1], [18, 1]],
  [[0, -1], [-5, -10], [-8, -14], [-6, -22], [0, -27]],
  [[12, 1], [10, 10], [8, 12]],
  [[18, 1], [24, -8], [26, -14]],
];

function nearPath(p: Vec2, width: number) {
  for (const path of PATHS)
    for (let i = 0; i < path.length - 1; i++) {
      const [a, b] = [path[i], path[i + 1]];
      const [dx, dz] = [b[0] - a[0], b[1] - a[1]];
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)));
      if (dist(p, [a[0] + dx * t, a[1] + dz * t]) < width) return true;
    }
  return false;
}

const TREE_MODELS = ['tree-oak', 'tree-pine', 'tree-pine-tall', 'tree-autumn', 'tree-fat'];
const FOREST_MODELS = ['tree-pine', 'tree-pine-tall', 'tree-pine', 'tree-oak', 'tree-fat'];

function freeSpot(p: Vec2, taken: Vec2[], spacing: number) {
  if (Math.hypot(p[0], p[1]) > ISLAND_RADIUS - 2) return false;
  if (CLEAR.some((c) => dist(p, c.at) < c.r)) return false;
  if (nearPath(p, 2.2)) return false;
  return taken.every((t) => dist(p, t) > spacing);
}

/** Лес и деревья: плотный бор на северо-западе, роща по краю острова, редкие деревья в лугах. */
export function generateTrees(): Placed[] {
  const random = rng(7);
  const trees: Placed[] = [];
  const taken: Vec2[] = [];
  const add = (p: Vec2, models: string[], spacing: number) => {
    if (!freeSpot(p, taken, spacing)) return;
    taken.push(p);
    const model = models[Math.floor(random() * models.length)];
    const scale = 2.6 + random() * 1.4;
    trees.push({ model, at: p, rot: random() * Math.PI * 2, scale, collider: { r: 0.28 * scale } });
  };
  // Бор: северо-запад.
  for (let i = 0; i < 420; i++) add([-36 + random() * 30, -38 + random() * 28], FOREST_MODELS, 3);
  // Кольцо по краю острова.
  for (let i = 0; i < 260; i++) {
    const a = random() * Math.PI * 2;
    const r = WALK_RADIUS - 1 + random() * 5;
    add([Math.cos(a) * r, Math.sin(a) * r], TREE_MODELS, 3.4);
  }
  // Луга.
  for (let i = 0; i < 90; i++) add([-40 + random() * 80, -40 + random() * 80], TREE_MODELS, 7);
  return trees;
}

/** Мелочи без коллайдеров: кусты, камни, грибы, цветы, трава. */
export function generateDecor(): Placed[] {
  const random = rng(42);
  const decor: Placed[] = [];
  const kinds: [string, number, number][] = [
    ['bush-1', 46, 0.55],
    ['rock-small', 30, 2.6],
    ['rock-tall', 6, 1.8],
    ['mushroom-red', 40, 2.6],
    ['flower-red', 90, 2],
    ['grass', 120, 0.45],
    ['stump', 10, 3],
  ];
  for (const [model, count, scale] of kinds)
    for (let i = 0; i < count; i++) {
      const a = random() * Math.PI * 2;
      const r = Math.sqrt(random()) * (ISLAND_RADIUS - 3);
      const p: Vec2 = [Math.cos(a) * r, Math.sin(a) * r];
      if (dist(p, LAKE.center) < LAKE.radius + 0.6 || CLEAR.slice(0, 2).some((c) => dist(p, c.at) < c.r - 2) || nearPath(p, 1.2)) continue;
      decor.push({ model, at: p, rot: random() * Math.PI * 2, scale: scale * (0.8 + random() * 0.5) });
    }
  return decor;
}

/** Крупные камни-ориентиры вокруг поляны Грибного короля. */
export const OBELISKS: Vec2[] = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2;
  return [BOSS_CLEARING[0] + Math.cos(a) * 6.5, BOSS_CLEARING[1] + Math.sin(a) * 6.5];
});

/** Ближайшая точка из списка в пределах radius или null. */
export function nearest<T>(items: T[], at: (item: T) => Vec2, p: Vec2, radius: number): T | null {
  let best: T | null = null;
  let bestD = radius;
  for (const item of items) {
    const d = dist(at(item), p);
    if (d < bestD) {
      best = item;
      bestD = d;
    }
  }
  return best;
}

export { dist };
