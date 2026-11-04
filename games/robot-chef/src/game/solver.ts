// Кратчайшее решение уровня (поиск в ширину по «клетка + что уже собрано»).
// Нужно для подсказки после нескольких неудач и для проверки, что каждый уровень проходим.
import type { Command } from './program';
import { DIRS, isFree, key, move, type Dir, type Kitchen } from './grid';

export function solve(kitchen: Kitchen): Dir[] | null {
  const foodIndex = new Map(kitchen.food.map((f, i) => [key(f.pos), i]));
  const full = (1 << kitchen.food.length) - 1;
  const stateKey = (x: number, y: number, mask: number) => `${x},${y},${mask}`;
  const start = { pos: kitchen.start, mask: 0, path: [] as Dir[] };
  const seen = new Set([stateKey(start.pos.x, start.pos.y, 0)]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.mask === full && key(cur.pos) === key(kitchen.pot)) return cur.path;
    for (const dir of DIRS) {
      const pos = move(cur.pos, dir);
      if (!isFree(kitchen, pos)) continue;
      const i = foodIndex.get(key(pos));
      const mask = i === undefined ? cur.mask : cur.mask | (1 << i);
      const k = stateKey(pos.x, pos.y, mask);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push({ pos, mask, path: [...cur.path, dir] });
    }
  }
  return null;
}

/**
 * Подсказка: сколько первых команд ребёнка ведут по решению (повторы можно раскладывать как угодно)
 * и какая стрелка нужна следующей. `next` — null, если решение уже целиком выложено.
 */
export function hintFor(solution: readonly Dir[], program: readonly Command[]): { keep: number; next: Dir | null } {
  let step = 0;
  let keep = 0;
  for (const c of program) {
    const fits = Array.from({ length: c.times }, (_, i) => solution[step + i] === c.dir).every(Boolean);
    if (!fits) break;
    step += c.times;
    keep++;
  }
  return { keep, next: solution[step] ?? null };
}
