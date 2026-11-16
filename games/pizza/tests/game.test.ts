import { describe, expect, it } from 'vitest';
import { check, hint, type Pizza } from '../src/game/check';
import { add, commonCut, equal, frac, simplify, slicesFor, sub } from '../src/game/fractions';
import { LEVELS } from '../src/game/levels';
import { bestCut, makeOrder, plainShare, type Order } from '../src/game/orders';
import { emptyProgress, isUnlocked, readProgress, recordWin, starsFor } from '../src/game/progress';
import type { Topping } from '../src/game/toppings';

/** Детерминированный генератор для повторяемых тестов. */
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const pizza = (spec: [Topping | null, number][]): Pizza => ({ slices: spec.flatMap(([t, n]) => Array<Topping | null>(n).fill(t)) });

const order = (parts: Order['parts']): Order => ({ guest: 'fox', parts, cut: null });

describe('дроби', () => {
  it('сокращает, складывает, сравнивает', () => {
    expect(simplify(frac(4, 8))).toEqual(frac(1, 2));
    expect(add(frac(1, 4), frac(1, 8))).toEqual(frac(3, 8));
    expect(sub(frac(1, 1), frac(2, 3))).toEqual(frac(1, 3));
    expect(equal(frac(2, 6), frac(1, 3))).toBe(true);
  });
  it('считает куски и общую нарезку', () => {
    expect(slicesFor(frac(1, 2), 8)).toBe(4);
    expect(slicesFor(frac(1, 3), 8)).toBeNull();
    expect(commonCut([frac(1, 2), frac(1, 3)])).toBe(6);
    expect(bestCut([{ topping: 'cheese', share: frac(1, 4) }, { topping: 'olive', share: frac(1, 3) }])).toBe(12);
  });
});

describe('проверка пиццы', () => {
  const o = order([{ topping: 'mushroom', share: frac(3, 8) }, { topping: 'cheese', share: frac(1, 4) }]);
  it('верная пицца и равная дробь на другой нарезке', () => {
    expect(check(o, pizza([['mushroom', 3], ['cheese', 2], [null, 3]]))).toEqual({ ok: true });
    expect(check(order([{ topping: 'olive', share: frac(1, 2) }]), pizza([['olive', 4], [null, 4]]))).toEqual({ ok: true });
  });
  it('находит ошибку нарезки, лишнюю начинку, не ту долю, пустые куски', () => {
    expect(check(o, pizza([['mushroom', 2], [null, 2]]))).toMatchObject({ kind: 'cut', slices: 4 });
    expect(check(o, pizza([['mushroom', 3], ['cheese', 2], ['olive', 1], [null, 2]]))).toMatchObject({ kind: 'extra', topping: 'olive' });
    expect(check(o, pizza([['mushroom', 2], ['cheese', 2], [null, 4]]))).toMatchObject({ kind: 'amount', topping: 'mushroom', have: 2, need: 3 });
    const full = order([{ topping: 'pepper', share: frac(1, 3) }, { topping: 'tomato', share: frac(2, 3), rest: true }]);
    expect(check(full, pizza([['pepper', 2], ['tomato', 3], [null, 1]]))).toMatchObject({ kind: 'amount', topping: 'tomato' });
  });
  it('подсказывает нарезку и число кусков', () => {
    expect(hint(o, pizza([[null, 6]]))).toEqual({ kind: 'cut', slices: 8 });
    expect(hint(o, pizza([['mushroom', 3], [null, 5]]))).toEqual({ kind: 'put', topping: 'cheese', count: 2, slices: 8 });
    expect(hint(o, pizza([['mushroom', 3], ['cheese', 2], [null, 3]]))).toBeNull();
  });
});

describe('заказы уровней', () => {
  it('каждый заказ решаем и соответствует правилам уровня', () => {
    for (const level of LEVELS) {
      const rng = seeded(level.n * 97);
      for (let i = 0; i < 200; i++) {
        const o = makeOrder(level, rng);
        expect(o.parts).toHaveLength(level.parts);
        const plain = plainShare(o.parts);
        expect(plain.n >= 0).toBe(true);
        if (!level.plain) expect(plain.n).toBe(0);
        const cut = o.cut ?? bestCut(o.parts)!;
        expect(cut).toBeGreaterThan(0);
        const slices = o.parts.flatMap((p) => Array<Topping>(slicesFor(p.share, cut)!).fill(p.topping));
        const solution = { slices: [...slices, ...Array<null>(cut - slices.length).fill(null)] };
        expect(check(o, solution)).toEqual({ ok: true });
        if (level.cut === 'order') expect(o.cut).toBe(bestCut(o.parts));
        if (typeof level.cut === 'number') expect(o.cut).toBe(level.cut);
        if (level.rest) expect(o.parts.at(-1)?.rest).toBe(true);
        expect(new Set(o.parts.map((p) => p.topping)).size).toBe(o.parts.length);
      }
    }
  });
  it('гость и доли не повторяются подряд', () => {
    const rng = seeded(5);
    let prev = makeOrder(LEVELS[0], rng);
    for (let i = 0; i < 50; i++) {
      const next = makeOrder(LEVELS[0], rng, prev);
      expect(next.guest).not.toBe(prev.guest);
      expect(next.parts[0].share).not.toEqual(prev.parts[0].share);
      prev = next;
    }
  });
});

describe('прогресс', () => {
  it('звёзды по ошибкам и открытие уровней', () => {
    expect([starsFor(0), starsFor(2), starsFor(5)]).toEqual([3, 2, 1]);
    const p = recordWin(emptyProgress(), 1, 1);
    expect(isUnlocked(p, 2)).toBe(true);
    expect(isUnlocked(p, 3)).toBe(false);
    expect(recordWin(p, 1, 4).stars[1]).toBe(2);
    expect(readProgress({ stars: { 1: 3, x: 2, 2: 9 } })).toEqual({ stars: { 1: 3 } });
    expect(readProgress(null)).toEqual(emptyProgress());
  });
});
