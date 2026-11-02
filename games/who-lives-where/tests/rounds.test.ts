import { describe, expect, it } from 'vitest';
import { allAnimals, habitatOf, habitats } from '../src/data';
import { buildRound, levelShape, mergeProgress } from '../src/rounds';

// Детерминированный генератор, чтобы раунды в тестах повторялись.
function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

describe('данные', () => {
  it('у каждого зверя и дома уникальный id, у зверя ровно один дом', () => {
    expect(new Set(habitats.map((h) => h.id)).size).toBe(habitats.length);
    expect(new Set(allAnimals.map((a) => a.id)).size).toBe(allAnimals.length);
    for (const animal of allAnimals) expect(habitatOf(animal.id)?.animals).toContain(animal);
  });

  it('в каждом доме хватает зверей на самый сложный уровень', () => {
    const { perHome } = levelShape(99);
    for (const home of habitats) expect(home.animals.length).toBeGreaterThanOrEqual(perHome);
  });
});

describe('раунды', () => {
  it.each([1, 2, 3, 4, 5, 7, 9, 50])('уровень %i: звери только из показанных домов, у каждого дома свои', (level) => {
    const { homes, perHome, maxTier } = levelShape(level);
    const round = buildRound(level, [], seeded(level));
    expect(round.homes).toHaveLength(homes);
    expect(round.animals).toHaveLength(homes * perHome);
    expect(round.homes.every((h) => h.tier <= maxTier)).toBe(true);
    for (const home of round.homes) {
      expect(round.animals.filter((a) => habitatOf(a.id) === home)).toHaveLength(perHome);
    }
  });

  it('первый уровень — только знакомые дома и всего 4 зверя', () => {
    const round = buildRound(1, [], seeded(1));
    expect(round.animals).toHaveLength(4);
    expect(round.homes.every((h) => h.tier === 1)).toBe(true);
  });

  it('сначала предлагает зверей, которых ребёнок ещё не встречал', () => {
    const farm = habitats.find((h) => h.id === 'farm')!;
    const found = farm.animals.slice(0, 4).map((a) => a.id);
    for (let seed = 1; seed < 20; seed++) {
      const round = buildRound(1, found, seeded(seed));
      const farmAnimals = round.animals.filter((a) => habitatOf(a.id) === farm);
      for (const animal of farmAnimals) expect(found).not.toContain(animal.id);
    }
  });
});

describe('прогресс', () => {
  it('уровень не падает, найденные только добавляются, неизвестные id отбрасываются', () => {
    const current = { level: 4, found: ['cow'] };
    expect(mergeProgress(current, { level: 2, found: ['fox', 'cow', 'dragon'] })).toEqual({ level: 4, found: ['cow', 'fox'] });
    expect(mergeProgress(current, { level: 5 })).toEqual({ level: 5, found: ['cow'] });
  });
});
