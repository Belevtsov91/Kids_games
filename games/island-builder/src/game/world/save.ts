// Сохранение острова на сервере: счётчики действий, компактный формат и его проверка при чтении.
import { BLOCK_TYPES, TREE_KINDS, cellKey, inBounds, parseKey, type BlockType, type TreeKind, type World } from './grid';

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
