// Вопросы к миру: высоты столбов и коллайдеры для физики.
import { MAX_HEIGHT, cellKey, parseKey, type World } from './grid';

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
