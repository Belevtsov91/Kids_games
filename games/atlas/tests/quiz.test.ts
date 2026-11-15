import { describe, expect, it } from 'vitest';
import { REGIONS, country, distance, inRegion } from '../src/game/countries';
import { ROUND_SIZE, buildRound, distractors, shuffle, starsFor } from '../src/game/quiz';

/** Предсказуемый генератор случайных чисел для тестов. */
const seeded = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) % 2 ** 31;
  return seed / 2 ** 31;
};

describe('вопросы', () => {
  it('в маршруте 10 вопросов, ответ всегда среди вариантов, варианты не повторяются', () => {
    for (const region of REGIONS) {
      for (let s = 1; s < 30; s++) {
        const round = buildRound(region, seeded(s));
        expect(round).toHaveLength(ROUND_SIZE);
        for (const q of round) {
          expect(q.options).toContain(q.answer);
          expect(new Set(q.options).size).toBe(q.options.length);
          expect(country(q.answer).region).toBe(region);
          expect(q.options.length).toBe(q.kind === 'city' ? 3 : 4);
        }
      }
    }
  });

  it('вопросы про города бывают только дома', () => {
    for (let s = 1; s < 20; s++) {
      expect(buildRound('europe', seeded(s)).some((q) => q.kind === 'city')).toBe(false);
      expect(buildRound('world', seeded(s)).some((q) => q.kind === 'city')).toBe(false);
    }
  });

  it('дома встречаются все три страны', () => {
    const round = buildRound('home', seeded(7));
    expect(new Set(round.map((q) => q.answer))).toEqual(new Set(inRegion('home').map((c) => c.id)));
  });

  it('у флага Молдовы среди ловушек — Румыния', () => {
    expect(distractors('flag', 'md', 'home', seeded(3))).toContain('ro');
  });

  it('метки на глобусе не слипаются', () => {
    for (const id of ['md', 'nl', 'jp', 'nz'] as const) {
      const options = distractors('globe', id, 'world', seeded(5));
      expect(options).toHaveLength(4);
      for (const other of options) if (other !== id) expect(distance(country(id), country(other))).toBeGreaterThanOrEqual(6);
    }
  });

  it('звёзды за маршрут', () => {
    expect(starsFor(10, 10)).toBe(3);
    expect(starsFor(8, 10)).toBe(2);
    expect(starsFor(6, 10)).toBe(1);
    expect(starsFor(5, 10)).toBe(0);
    expect(starsFor(0, 0)).toBe(0);
  });

  it('перемешивание сохраняет элементы', () => {
    expect(shuffle([1, 2, 3, 4], seeded(1)).sort()).toEqual([1, 2, 3, 4]);
  });
});
