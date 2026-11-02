// Правки мира: каждая функция возвращает список изменений, applyChanges применяет или откатывает его.
import { PLANTABLE, cellKey, inBounds, type BlockType, type Cell, type Change, type TreeKind, type World } from './grid';

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
