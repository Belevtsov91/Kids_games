// Заказы гостей: какие начинки и какой долей. Всё, что заказ требует, можно ровно нарезать.
import { CUTS, type Level } from './levels';
import { commonCut, equal, frac, less, simplify, sub, sum, type Frac } from './fractions';
import { TOPPINGS, type Topping } from './toppings';

export const GUESTS = ['fox', 'rabbit', 'owl', 'squirrel', 'hedgehog', 'frog', 'raccoon'] as const;
export type Guest = (typeof GUESTS)[number];

export interface Part {
  topping: Topping;
  share: Frac;
  /** В заказе написано «остальное», а не дробь. */
  rest?: boolean;
}

export interface Order {
  guest: Guest;
  parts: Part[];
  /** Если пицца приходит нарезанной — на сколько кусков. */
  cut: number | null;
}

type Rng = () => number;
const pick = <T>(list: readonly T[], rng: Rng) => list[Math.floor(rng() * list.length)];

/** Самая крупная нарезка из доступных (меньше всего кусков), на которую делится заказ. */
export const bestCut = (parts: Part[]) => {
  const need = commonCut(parts.map((p) => p.share));
  return CUTS.find((c) => c % need === 0) ?? null;
};

/** Доля без начинки: 1 минус все начинки. */
export const plainShare = (parts: Part[]) => sub(frac(1, 1), sum(parts.map((p) => p.share)));

function shares(level: Level, rng: Rng): Frac[] | null {
  const list: Frac[] = [];
  for (let i = 0; i < level.parts; i++) {
    const d = pick(level.dens, rng);
    const n = 1 + Math.floor(rng() * (d - 1));
    list.push(simplify(frac(n, d)));
  }
  if (level.rest) list[list.length - 1] = sub(frac(1, 1), sum(list.slice(0, -1)));
  const total = sum(list);
  if (list.some((f) => f.n <= 0) || less(frac(1, 1), total)) return null;
  const full = total.n === total.d;
  if (level.plain ? level.parts > 1 && full : !full) return null;
  return list;
}

const sameShares = (a: Frac[], b?: Order) => !!b && a.length === b.parts.length && a.every((f, i) => equal(f, b.parts[i].share));

/** Собираем случайный заказ уровня; гарантированно решаемый. По возможности не повторяет доли и гостя прошлого заказа. */
export function makeOrder(level: Level, rng: Rng = Math.random, prev?: Order): Order {
  for (let tries = 0; tries < 500; tries++) {
    const list = shares(level, rng);
    if (!list || (tries < 50 && sameShares(list, prev))) continue;
    const tops = [...TOPPINGS].sort(() => rng() - 0.5).slice(0, list.length);
    const parts: Part[] = list.map((share, i) => ({ topping: tops[i], share, rest: level.rest && i === list.length - 1 }));
    const need = commonCut(list);
    const cut = level.cut === 'free' ? null : level.cut === 'order' ? bestCut(parts) : level.cut;
    if (level.cut === 'free' ? bestCut(parts) === null : cut === null || cut % need !== 0) continue;
    const guest = pick(GUESTS.filter((g) => g !== prev?.guest), rng);
    return { guest, parts, cut };
  }
  throw new Error(`Не удалось собрать заказ для уровня ${level.n}`);
}
