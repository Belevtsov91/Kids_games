// Сетка острова: размеры, типы блоков и деревьев, ключи клеток и перевод координат.
// Без DOM и Three: модель используют и сцена, и сервер, и тесты.

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
