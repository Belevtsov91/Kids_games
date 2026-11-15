import { describe, expect, it } from 'vitest';
import { canPlace, isBlocked, leftOf, machineOf, place, removeAt } from '../src/game/board';
import { LEVELS } from '../src/game/levels';
import { nextVariant, partInfo, type Placed } from '../src/game/parts';
import { isOpen, parseBest, recordBest, starsFor, totalStars } from '../src/game/score';

const level = LEVELS[0];
const ramp = (id: number, col: number, row: number): Placed => ({ id, kind: 'ramp', col, row, variant: 0 });

describe('доска', () => {
  it('не даёт ставить на полку, за край и в занятую клетку', () => {
    expect(isBlocked(level, 2, 5)).toBe(true);
    expect(canPlace(level, [], -1, 0)).toBe(false);
    expect(canPlace(level, [], 0, 99)).toBe(false);
    expect(canPlace(level, [ramp(1, 10, 2)], 10, 2)).toBe(false);
    expect(canPlace(level, [], 10, 2)).toBe(true);
  });

  it('считает запас деталей и не ставит лишнее', () => {
    let placed: Placed[] = [];
    placed = place(level, placed, ramp(1, 10, 2));
    placed = place(level, placed, ramp(2, 12, 2));
    expect(leftOf(level, placed, 'ramp')).toBe(0);
    expect(place(level, placed, ramp(3, 12, 4))).toBe(placed);
    expect(place(level, placed, { id: 4, kind: 'gear', col: 12, row: 4, variant: 0 })).toBe(placed);
  });

  it('убирает деталь и добавляет готовые детали уровня', () => {
    expect(removeAt([ramp(1, 10, 2)], 10, 2)).toEqual([]);
    const boomerang = LEVELS.find((l) => l.fixed)!;
    const machine = machineOf(boomerang, [ramp(1, 10, 2)]);
    expect(machine).toHaveLength(2);
    expect(machine[0].id).toBeLessThan(0);
  });

  it('нажатие перебирает варианты по кругу', () => {
    let part = ramp(1, 10, 2);
    for (let i = 0; i < partInfo('ramp').variants; i++) part = nextVariant(part);
    expect(part.variant).toBe(0);
  });
});

describe('звёзды', () => {
  it('ноль без лампы, три за всё сразу', () => {
    expect(starsFor(level, { lit: false, star: true, used: 1 })).toBe(0);
    expect(starsFor(level, { lit: true, star: false, used: 2 })).toBe(1);
    expect(starsFor(level, { lit: true, star: true, used: 1 })).toBe(3);
  });

  it('помнит лучший результат и открывает следующий уровень', () => {
    let best = recordBest({}, 'ramp', 2);
    best = recordBest(best, 'ramp', 1);
    expect(best.ramp).toBe(2);
    expect(isOpen(LEVELS, {}, 0)).toBe(true);
    expect(isOpen(LEVELS, {}, 1)).toBe(false);
    expect(isOpen(LEVELS, best, 1)).toBe(true);
    expect(totalStars({ a: 2, b: 3 })).toBe(5);
  });

  it('битое сохранение не ломает игру', () => {
    expect(parseBest(null)).toEqual({});
    expect(parseBest({ ramp: 9, spring: 'x', lever: 2 })).toEqual({ lever: 2 });
  });
});
