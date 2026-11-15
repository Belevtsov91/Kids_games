import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/game/levels';
import { allLit, cleanStars, isOpen, record } from '../src/game/save';
import { simulate, spent } from '../src/game/sim';
import { cheapest, par, starsFor } from '../src/game/solver';
import { COST } from '../src/game/types';
import { en } from '../src/i18n/en';

describe('уровни', () => {
  it.each(LEVELS.map((l) => [l.id, l] as const))('район %i решается в пределах бюджета и не решается даром', (_id, level) => {
    expect(simulate(level, {}).ok).toBe(false);
    const plan = cheapest(level);
    expect(plan).not.toBeNull();
    expect(plan!.cost).toBeLessThanOrEqual(level.budget);
    expect(spent(plan!.layout, COST)).toBe(plan!.cost);
    expect(simulate(level, plan!.layout).ok).toBe(true);
    for (const tool of Object.values(plan!.layout)) expect(level.tools).toContain(tool);
  });

  it('у каждого района есть тексты и одинаковая ширина строк карты', () => {
    for (const level of LEVELS) {
      expect(en.levels[level.key]).toBeDefined();
      expect(new Set(level.map.map((row) => row.length)).size).toBe(1);
    }
  });

  it('звёзды: лучшее решение — три, дороже — меньше', () => {
    const level = LEVELS[1];
    expect(starsFor(level, par(level))).toBe(3);
    expect(starsFor(level, par(level) + 1)).toBe(2);
    expect(starsFor(level, par(level) + 20)).toBe(1);
  });
});

describe('сохранение', () => {
  it('отбрасывает мусор и открывает районы по порядку', () => {
    const stars = cleanStars({ 1: 3, 2: 9, x: 1, 999: 2 });
    expect(stars).toEqual({ 1: 3 });
    expect(isOpen(stars, 1)).toBe(true);
    expect(isOpen(stars, 2)).toBe(true);
    expect(isOpen(stars, 3)).toBe(false);
    expect(cleanStars(null)).toEqual({});
  });

  it('звёзды только растут', () => {
    expect(record({ 1: 3 }, 1, 1)).toEqual({ 1: 3 });
    expect(record({}, 2, 2)).toEqual({ 2: 2 });
    expect(allLit(Object.fromEntries(LEVELS.map((l) => [l.id, 1])))).toBe(true);
  });
});
