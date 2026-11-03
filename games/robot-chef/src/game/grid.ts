// Кухня-клетчатка: разбор карты уровня из строк. Без DOM — покрыто тестами.

export type Dir = 'up' | 'down' | 'left' | 'right';
export const DIRS: readonly Dir[] = ['up', 'down', 'left', 'right'];
export const STEP: Record<Dir, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export interface Pos {
  x: number;
  y: number;
}

/** Продукт на клетке: буква на карте → id продукта. */
export const FOOD: Record<string, string> = {
  c: 'carrot', t: 'tomato', m: 'mushroom', e: 'egg', o: 'onion', p: 'potato', k: 'corn', h: 'cheese',
};

export interface Kitchen {
  width: number;
  height: number;
  start: Pos;
  pot: Pos;
  /** Препятствия: ключи "x,y". */
  walls: ReadonlySet<string>;
  /** Продукты в порядке появления на карте. */
  food: { id: string; pos: Pos }[];
}

export const key = (p: Pos) => `${p.x},${p.y}`;

/**
 * Карта: `R` — робот, `P` — кастрюля, `#` — стол-препятствие, `.` — пол, буквы из FOOD — продукты.
 * Все строки одной длины.
 */
export function parseKitchen(rows: readonly string[]): Kitchen {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  let start: Pos | null = null;
  let pot: Pos | null = null;
  const walls = new Set<string>();
  const food: Kitchen['food'] = [];
  rows.forEach((row, y) => {
    if (row.length !== width) throw new Error(`Строка ${y} другой длины`);
    [...row].forEach((ch, x) => {
      if (ch === 'R') start = { x, y };
      else if (ch === 'P') pot = { x, y };
      else if (ch === '#') walls.add(key({ x, y }));
      else if (FOOD[ch]) food.push({ id: FOOD[ch], pos: { x, y } });
      else if (ch !== '.') throw new Error(`Неизвестная клетка "${ch}"`);
    });
  });
  if (!start || !pot) throw new Error('На карте нужны R и P');
  return { width, height, start, pot, walls, food };
}

/** Можно ли встать на клетку: внутри кухни и не стол. */
export const isFree = (k: Kitchen, p: Pos) =>
  p.x >= 0 && p.y >= 0 && p.x < k.width && p.y < k.height && !k.walls.has(key(p));

export const move = (p: Pos, d: Dir): Pos => ({ x: p.x + STEP[d].dx, y: p.y + STEP[d].dy });
