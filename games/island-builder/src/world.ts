// Модель острова без DOM и Three: её используют и сцена, и сервер, и тесты.

export const GRID = 20;
export const MAX_HEIGHT = 12;
/** Уровень воды в мировых координатах: нижний слой блоков наполовину в воде. */
export const WATER_Y = 0.7;

export const BLOCK_TYPES = ['grass', 'sand', 'stone', 'wood', 'brick', 'glass', 'snow', 'lantern'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const TREE_KINDS = ['palm', 'pine', 'round', 'flowers'] as const;
export type TreeKind = (typeof TREE_KINDS)[number];

/** На чём растут деревья. */
export const PLANTABLE: ReadonlySet<BlockType> = new Set(['grass', 'sand', 'snow']);

export interface World {
  blocks: ReadonlyMap<string, BlockType>;
  trees: ReadonlyMap<string, TreeKind>;
}

export interface Cell {
  x: number;
  y: number;
  z: number;
}

/** Одно изменение мира; список изменений — одно действие, его же откатывает «Отменить». */
export type Change =
  | { layer: 'block'; key: string; before: BlockType | null; after: BlockType | null }
  | { layer: 'tree'; key: string; before: TreeKind | null; after: TreeKind | null };

export const cellKey = (x: number, y: number, z: number) => `${x},${y},${z}`;

export function parseKey(key: string): Cell {
  const [x, y, z] = key.split(',').map(Number);
  return { x, y, z };
}

export const inBounds = ({ x, y, z }: Cell) =>
  Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(z) &&
  x >= 0 && x < GRID && z >= 0 && z < GRID && y >= 0 && y < MAX_HEIGHT;

/** Центр клетки в мировых координатах (остров по центру сцены). */
export const cellToWorld = ({ x, y, z }: Cell): [number, number, number] => [x - GRID / 2 + 0.5, y + 0.5, z - GRID / 2 + 0.5];

/** Клетка, в которую попадает мировая точка. */
export const worldToCell = (wx: number, wy: number, wz: number): Cell => ({
  x: Math.floor(wx + GRID / 2),
  y: Math.floor(wy),
  z: Math.floor(wz + GRID / 2),
});

export const emptyWorld = (): World => ({ blocks: new Map(), trees: new Map() });

export function applyChanges(world: World, changes: Change[], undo = false): World {
  if (!changes.length) return world;
  const blocks = new Map(world.blocks);
  const trees = new Map(world.trees);
  const list = undo ? [...changes].reverse() : changes;
  for (const change of list) {
    const value = undo ? change.before : change.after;
    const map = (change.layer === 'block' ? blocks : trees) as Map<string, string>;
    if (value === null) map.delete(change.key);
    else map.set(change.key, value);
  }
  return { blocks, trees };
}

const isFree = (world: World, key: string) => !world.blocks.has(key) && !world.trees.has(key);

export function placeBlock(world: World, cell: Cell, type: BlockType): Change[] {
  const key = cellKey(cell.x, cell.y, cell.z);
  if (!inBounds(cell) || !isFree(world, key)) return [];
  return [{ layer: 'block', key, before: null, after: type }];
}

/** Убирает блок; дерево, стоявшее на нём, падает вместе с ним. */
export function removeBlock(world: World, cell: Cell): Change[] {
  const key = cellKey(cell.x, cell.y, cell.z);
  const before = world.blocks.get(key);
  if (!before) return [];
  const changes: Change[] = [{ layer: 'block', key, before, after: null }];
  const above = cellKey(cell.x, cell.y + 1, cell.z);
  const tree = world.trees.get(above);
  if (tree) changes.push({ layer: 'tree', key: above, before: tree, after: null });
  return changes;
}

export function paintBlock(world: World, cell: Cell, type: BlockType): Change[] {
  const key = cellKey(cell.x, cell.y, cell.z);
  const before = world.blocks.get(key);
  if (!before || before === type) return [];
  const changes: Change[] = [{ layer: 'block', key, before, after: type }];
  // Перекрасили землю под деревом в камень — дерево не выживет.
  const above = cellKey(cell.x, cell.y + 1, cell.z);
  const tree = world.trees.get(above);
  if (tree && !PLANTABLE.has(type)) changes.push({ layer: 'tree', key: above, before: tree, after: null });
  return changes;
}

/** Сажает дерево в клетку `cell`; под ней должна быть трава, песок или снег. */
export function plantTree(world: World, cell: Cell, kind: TreeKind): Change[] {
  const key = cellKey(cell.x, cell.y, cell.z);
  const ground = world.blocks.get(cellKey(cell.x, cell.y - 1, cell.z));
  if (!inBounds(cell) || !isFree(world, key) || !ground || !PLANTABLE.has(ground)) return [];
  return [{ layer: 'tree', key, before: null, after: kind }];
}

export function removeTree(world: World, cell: Cell): Change[] {
  const key = cellKey(cell.x, cell.y, cell.z);
  const before = world.trees.get(key);
  return before ? [{ layer: 'tree', key, before, after: null }] : [];
}

/** Высота столба: верх самого высокого блока (0 — пусто). */
export function columnHeight(world: World, x: number, z: number): number {
  for (let y = MAX_HEIGHT - 1; y >= 0; y--) if (world.blocks.has(cellKey(x, y, z))) return y + 1;
  return 0;
}

export function maxHeight(world: World): number {
  let max = 0;
  for (const key of world.blocks.keys()) max = Math.max(max, parseKey(key).y + 1);
  return max;
}

/** Столбы для физики: по одному коллайдеру на клетку сетки, от дна до верхнего блока. */
export function columns(world: World): { x: number; z: number; height: number }[] {
  const tops = new Map<string, { x: number; z: number; height: number }>();
  for (const key of world.blocks.keys()) {
    const { x, y, z } = parseKey(key);
    const id = `${x},${z}`;
    const current = tops.get(id);
    if (!current || current.height < y + 1) tops.set(id, { x, z, height: y + 1 });
  }
  return [...tops.values()];
}

// ---------- Генератор острова ----------

/** Детерминированный генератор случайных чисел: один seed — один и тот же остров. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateIsland(seed: number): World {
  const random = rng(seed);
  // Несколько «холмов» разной силы задают рельеф.
  const hills = Array.from({ length: 4 }, () => ({
    x: GRID / 2 + (random() - 0.5) * 8,
    z: GRID / 2 + (random() - 0.5) * 8,
    r: 3 + random() * 4,
    h: 1.5 + random() * 3.5,
  }));
  const radius = 6 + random() * 2;
  const blocks = new Map<string, BlockType>();
  const trees = new Map<string, TreeKind>();

  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      const dx = x + 0.5 - GRID / 2;
      const dz = z + 0.5 - GRID / 2;
      const wobble = Math.sin(x * 0.9 + seed) * 0.8 + Math.cos(z * 0.7 + seed * 0.3) * 0.8;
      const dist = Math.hypot(dx, dz) + wobble;
      if (dist > radius) continue;
      let height = 1;
      for (const hill of hills) {
        const d = Math.hypot(x - hill.x, z - hill.z);
        if (d < hill.r) height += hill.h * (1 - d / hill.r) ** 2;
      }
      // У берега остров плоский: пляж.
      if (dist > radius - 1.5) height = 1;
      const top = Math.min(MAX_HEIGHT - 2, Math.max(1, Math.round(height)));
      for (let y = 0; y < top; y++) {
        let type: BlockType;
        if (y === top - 1) type = top === 1 ? 'sand' : top >= 6 ? 'snow' : top >= 5 ? 'stone' : 'grass';
        else type = top - y > 2 ? 'stone' : top === 1 ? 'sand' : 'grass';
        blocks.set(cellKey(x, y, z), type);
      }
      const ground = blocks.get(cellKey(x, top - 1, z))!;
      if (random() < (ground === 'grass' ? 0.12 : ground === 'sand' ? 0.05 : ground === 'snow' ? 0.15 : 0)) {
        const kind: TreeKind = ground === 'sand' ? 'palm' : ground === 'snow' ? 'pine' : random() < 0.3 ? 'flowers' : random() < 0.5 ? 'round' : 'pine';
        trees.set(cellKey(x, top, z), kind);
      }
    }
  }
  return { blocks, trees };
}

/** Маленький плоский островок: чистый лист для своей постройки. */
export function flatIsland(): World {
  const blocks = new Map<string, BlockType>();
  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      const d = Math.hypot(x + 0.5 - GRID / 2, z + 0.5 - GRID / 2);
      if (d <= 6) blocks.set(cellKey(x, 0, z), d > 4.8 ? 'sand' : 'grass');
    }
  }
  return { blocks, trees: new Map() };
}

// ---------- Сохранение ----------

export interface Stats {
  placed: number;
  planted: number;
  painted: number;
  dug: number;
  boats: number;
  crates: number;
}

export const STAT_KEYS = ['placed', 'planted', 'painted', 'dug', 'boats', 'crates'] as const satisfies readonly (keyof Stats)[];

export const emptyStats = (): Stats => ({ placed: 0, planted: 0, painted: 0, dug: 0, boats: 0, crates: 0 });

/** Формат сохранения на сервере: компактные массивы [x, y, z, индекс типа]. */
export interface SaveData {
  v: 1;
  blocks: [number, number, number, number][];
  trees: [number, number, number, number][];
  stats: Stats;
  night: boolean;
  /** id выполненных заданий. */
  achieved: string[];
}

export const MAX_TREES = 200;

export interface Island {
  world: World;
  stats: Stats;
  night: boolean;
  achieved: string[];
}

export function serialize({ world, stats, night, achieved }: Island): SaveData {
  const pack = <T extends string>(map: ReadonlyMap<string, T>, list: readonly T[]) =>
    [...map].map(([key, value]) => {
      const { x, y, z } = parseKey(key);
      return [x, y, z, list.indexOf(value)] as [number, number, number, number];
    });
  return {
    v: 1,
    blocks: pack(world.blocks, BLOCK_TYPES),
    trees: pack(world.trees, TREE_KINDS),
    stats: { ...stats },
    night,
    achieved: [...achieved],
  };
}

/** Читает сохранение; всё некорректное молча отбрасывается, чтобы битые данные не ломали игру. */
export function deserialize(data: unknown): Island | null {
  const d = data as Partial<SaveData> | null;
  if (!d || d.v !== 1 || !Array.isArray(d.blocks) || !Array.isArray(d.trees)) return null;
  const blocks = new Map<string, BlockType>();
  for (const item of d.blocks) {
    if (!Array.isArray(item)) continue;
    const [x, y, z, t] = item;
    const type = BLOCK_TYPES[t];
    if (type && inBounds({ x, y, z })) blocks.set(cellKey(x, y, z), type);
  }
  const trees = new Map<string, TreeKind>();
  for (const item of d.trees) {
    if (!Array.isArray(item) || trees.size >= MAX_TREES) continue;
    const [x, y, z, t] = item;
    const kind = TREE_KINDS[t];
    const key = cellKey(x, y, z);
    if (kind && inBounds({ x, y, z }) && !blocks.has(key)) trees.set(key, kind);
  }
  const s = (d.stats ?? {}) as Partial<Record<keyof Stats, unknown>>;
  const stats = emptyStats();
  for (const key of STAT_KEYS) {
    const n = s[key];
    if (Number.isInteger(n) && (n as number) >= 0) stats[key] = n as number;
  }
  const achieved = Array.isArray(d.achieved) ? d.achieved.filter((id): id is string => typeof id === 'string').slice(0, 50) : [];
  return { world: { blocks, trees }, stats, night: d.night === true, achieved };
}
