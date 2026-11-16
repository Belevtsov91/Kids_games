// Проверка пиццы перед печью и подсказка. Пицца — это число кусков и начинка на каждом (null — без начинки).
import { equal, frac, slicesFor, type Frac } from './fractions';
import { bestCut, plainShare, type Order } from './orders';
import type { Topping } from './toppings';

export interface Pizza {
  slices: (Topping | null)[];
}

export type Verdict =
  | { ok: true }
  | { ok: false; kind: 'cut'; share: Frac; slices: number }
  | { ok: false; kind: 'extra'; topping: Topping }
  | { ok: false; kind: 'amount'; topping: Topping; have: number; need: number; slices: number }
  | { ok: false; kind: 'plain'; have: number; need: number; slices: number };

export const countOf = (pizza: Pizza, topping: Topping | null) => pizza.slices.filter((s) => s === topping).length;

export function check(order: Order, pizza: Pizza): Verdict {
  const k = pizza.slices.length;
  const wanted = new Set(order.parts.map((p) => p.topping));
  for (const part of order.parts) {
    if (slicesFor(part.share, k) === null) return { ok: false, kind: 'cut', share: part.share, slices: k };
  }
  const extra = pizza.slices.find((s): s is Topping => s !== null && !wanted.has(s));
  if (extra) return { ok: false, kind: 'extra', topping: extra };
  for (const part of order.parts) {
    const have = countOf(pizza, part.topping);
    if (!equal(frac(have, k), part.share)) return { ok: false, kind: 'amount', topping: part.topping, have, need: slicesFor(part.share, k)!, slices: k };
  }
  const plain = countOf(pizza, null);
  const need = slicesFor(plainShare(order.parts), k)!;
  if (plain !== need) return { ok: false, kind: 'plain', have: plain, need, slices: k };
  return { ok: true };
}

export type Hint = { kind: 'cut'; slices: number } | { kind: 'put'; topping: Topping; count: number; slices: number };

/** Подсказка: сначала про нарезку, потом про первую начинку, где не хватает или лишнее. */
export function hint(order: Order, pizza: Pizza): Hint | null {
  const k = pizza.slices.length;
  if (order.parts.some((p) => slicesFor(p.share, k) === null)) return { kind: 'cut', slices: bestCut(order.parts) ?? k };
  for (const part of order.parts) {
    const count = slicesFor(part.share, k)!;
    if (countOf(pizza, part.topping) !== count) return { kind: 'put', topping: part.topping, count, slices: k };
  }
  return null;
}
