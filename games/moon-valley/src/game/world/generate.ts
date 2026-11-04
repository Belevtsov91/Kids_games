// Генерация растительности: лес, декор и травинки. Детерминированно (один и тот же сид — один и тот же лес),
// с обходом домов, сада, дорожек, озера и поляны босса.

import { dist, nearPath, rng } from './geometry';
import { CHESTS, CRYSTALS } from './inhabitants';
import { BOSS_CLEARING, BUILDINGS, GREENHOUSE_SPOT, HOME, ISLAND_RADIUS, LAKE, PLOTS, WALK_RADIUS, type Placed, type Vec2 } from './map';

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

/**
 * Травинки для густого луга: детерминированно, не на дорожках, не в озере, не на грядках и не в домах.
 * Возвращает [x, z, масштаб, поворот] для каждой травинки.
 */
export function generateGrass(count: number): [number, number, number, number][] {
  const random = rng(99);
  const blades: [number, number, number, number][] = [];
  for (let i = 0; i < count * 3 && blades.length < count; i++) {
    const a = random() * Math.PI * 2;
    const r = Math.sqrt(random()) * (ISLAND_RADIUS - 2);
    const p: Vec2 = [Math.cos(a) * r, Math.sin(a) * r];
    if (dist(p, LAKE.center) < LAKE.radius + 1.2) continue;
    if (nearPath(p, 1.25)) continue;
    if (PLOTS.some((plot) => dist(p, plot) < 1.5)) continue;
    if (BUILDINGS.some((b) => dist(p, b.at) < 4.2)) continue;
    blades.push([p[0], p[1], 0.7 + random() * 0.7, random() * Math.PI * 2]);
  }
  return blades;
}
