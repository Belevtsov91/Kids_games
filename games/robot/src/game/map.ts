// Островок-клетчатка: разбор карты уровня из строк. Без DOM — покрыто тестами.

/** Куда смотрит робот: север, восток, юг, запад (вверх, вправо, вниз, влево на экране). */
export type Heading = 'n' | 'e' | 's' | 'w';
export const HEADINGS: readonly Heading[] = ['n', 'e', 's', 'w'];
const STEP: Record<Heading, { dx: number; dy: number }> = {
  n: { dx: 0, dy: -1 },
  e: { dx: 1, dy: 0 },
  s: { dx: 0, dy: 1 },
  w: { dx: -1, dy: 0 },
};

export interface Pos {
  x: number;
  y: number;
}

/** Кто ждёт посылку: буква на карте → id жителя. */
export const FRIENDS: Record<string, string> = { T: 'bear', Z: 'bunny', F: 'fox', H: 'hedgehog' };

export interface Island {
  width: number;
  height: number;
  start: Pos;
  heading: Heading;
  /** Деревья и вода — туда робот не проедет. Ключи "x,y". */
  trees: ReadonlySet<string>;
  water: ReadonlySet<string>;
  /** Посылки, которые надо подобрать. */
  parcels: Pos[];
  /** Жители, которым надо доставить по посылке. */
  friends: { id: string; pos: Pos }[];
}

export const key = (p: Pos) => `${p.x},${p.y}`;

/**
 * Карта: `R` — робот, `b` — посылка, `#` — дерево, `~` — вода, `.` — травка, буквы из FRIENDS — жители.
 * Все строки одной длины. Посылок столько же, сколько жителей.
 */
export function parseIsland(rows: readonly string[], heading: Heading = 'e'): Island {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  let start: Pos | null = null;
  const trees = new Set<string>();
  const water = new Set<string>();
  const parcels: Pos[] = [];
  const friends: Island['friends'] = [];
  rows.forEach((row, y) => {
    if (row.length !== width) throw new Error(`Строка ${y} другой длины`);
    [...row].forEach((ch, x) => {
      const p = { x, y };
      if (ch === 'R') start = p;
      else if (ch === 'b') parcels.push(p);
      else if (ch === '#') trees.add(key(p));
      else if (ch === '~') water.add(key(p));
      else if (FRIENDS[ch]) friends.push({ id: FRIENDS[ch], pos: p });
      else if (ch !== '.') throw new Error(`Неизвестная клетка "${ch}"`);
    });
  });
  if (!start) throw new Error('На карте нужен R');
  if (parcels.length !== friends.length || !friends.length) throw new Error('Посылок должно быть столько же, сколько жителей');
  return { width, height, start, heading, trees, water, parcels, friends };
}

/** Можно ли встать на клетку: внутри острова, не дерево и не вода. */
export const isFree = (m: Island, p: Pos) =>
  p.x >= 0 && p.y >= 0 && p.x < m.width && p.y < m.height && !m.trees.has(key(p)) && !m.water.has(key(p));

export const ahead = (p: Pos, h: Heading): Pos => ({ x: p.x + STEP[h].dx, y: p.y + STEP[h].dy });

/** Поворот на месте: налево — против часовой стрелки, направо — по ней. */
export const turn = (h: Heading, side: 'left' | 'right'): Heading =>
  HEADINGS[(HEADINGS.indexOf(h) + (side === 'right' ? 1 : 3)) % 4];
