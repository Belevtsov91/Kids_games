import { describe, expect, it } from 'vitest';
import { adapt, startAdapt } from '../src/game/adapt';
import { judge, juiceTarget, pour } from '../src/game/juice';
import { COINS, makeOrder, payState, sum, target } from '../src/game/money';
import { emptyProgress, readProgress } from '../src/game/progress';
import { balanceItem, comparePair, tilt } from '../src/game/scales';

const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe('адаптивность', () => {
  it('три верных — выше, две ошибки — ниже, в пределах', () => {
    let a = startAdapt();
    for (let i = 0; i < 3; i++) a = adapt(a, true, 4);
    expect(a.level).toBe(2);
    a = adapt(adapt(a, false, 4), false, 4);
    expect(a.level).toBe(1);
    a = adapt(adapt(a, false, 4), false, 4);
    expect(a.level).toBe(1);
  });
});

describe('весы', () => {
  it('пара всегда разного веса, на первом уровне — заметно', () => {
    const r = rng(7);
    for (let i = 0; i < 50; i++) {
      const [a, b] = comparePair(1, r);
      expect(Math.abs(a.weight - b.weight)).toBeGreaterThanOrEqual(4);
    }
  });
  it('товар для гирек по уровню и наклон', () => {
    const r = rng(3);
    for (let i = 0; i < 30; i++) expect(balanceItem(1, r).weight).toBeLessThanOrEqual(4);
    expect(tilt(3, 3)).toBe(0);
    expect(tilt(10, 0)).toBe(-1);
  });
});

describe('касса', () => {
  it('заказы по уровням', () => {
    const r = rng(11);
    for (let level = 1; level <= 4; level++) {
      for (let i = 0; i < 40; i++) {
        const o = makeOrder(level, r);
        expect(sum(o.goods.map((g) => g.price))).toBe(o.total);
        expect(o.goods.every((g) => g.price >= 1)).toBe(true);
        expect(o.coins.every((c) => (COINS as readonly number[]).includes(c))).toBe(true);
        if (level === 1) expect(o.total).toBeLessThanOrEqual(5);
        if (level === 4) expect(target(o)).toBeGreaterThan(0);
      }
    }
  });
  it('мало, ровно, много', () => {
    const o = { goods: [], total: 7, paid: null, coins: [1, 2, 5] as const };
    expect(payState(o, [5])).toBe('less');
    expect(payState(o, [5, 2])).toBe('exact');
    expect(payState(o, [5, 5])).toBe('more');
    expect(target({ ...o, paid: 10 })).toBe(3);
  });
});

describe('сок', () => {
  it('попадание с допуском', () => {
    expect(judge(1, 0.5, 0.55)).toBe('ok');
    expect(judge(3, 0.5, 0.55)).toBe('more');
    expect(judge(3, 0.5, 0.4)).toBe('less');
    expect(pour(0.95, 1000)).toBe(1);
    expect([0.25, 0.5, 0.75]).toContain(juiceTarget(1, rng(1)));
  });
});

describe('прогресс', () => {
  it('читает сохранение безопасно', () => {
    expect(readProgress({ adapt: { scales: { level: 3 }, juice: { level: 99 } }, wins: { cash: 4 } }).adapt.scales.level).toBe(3);
    expect(readProgress(null)).toEqual(emptyProgress());
  });
});
