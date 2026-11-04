// Карта долины: размеры острова, ориентиры, дома, мебель деревни, забор сада и дорожки.
// Только данные (метры, вид сверху: x — восток, z — юг). Сцена расставляет по ним модели и коллайдеры.

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

/** Дорожки: от дома к деревне, к лесу, к поляне. Деревья на них не растут. */
export const PATHS: Vec2[][] = [
  [[0, -1], [6, 0], [12, 1], [18, 1]],
  [[0, -1], [-5, -10], [-8, -14], [-6, -22], [0, -27]],
  [[12, 1], [10, 10], [8, 12]],
  [[18, 1], [24, -8], [26, -14]],
];
