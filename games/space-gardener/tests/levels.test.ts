import { describe, expect, it } from 'vitest';
import { levels } from '../src/game/levels';
import { applySolution, Simulation } from '../src/game/simulation';
import { starsFor } from '../src/game/scoring';

/** Гоняет попытку до конца (не дольше минуты игрового времени). */
function play(sim: Simulation) {
  sim.startPour();
  for (let i = 0; i < 60 * 60 && sim.phase === 'pouring'; i++) sim.step();
  return sim;
}

describe('уровни', () => {
  it('id уровней уникальны', () => {
    expect(new Set(levels.map((l) => l.id)).size).toBe(levels.length);
  });

  it.each(levels)('$name: нужно капель не больше, чем выпустит комета', (level) => {
    expect(level.need).toBeLessThan(level.drops);
  });

  it.each(levels)('$name: без лиан цветок не вырастет', (level) => {
    expect(play(new Simulation(level, 1)).phase).toBe('lost');
  });

  it.each(levels)('$name: решение из подсказки проходит уровень', (level) => {
    for (const seed of [1, 2, 3]) {
      const sim = new Simulation(level, seed);
      applySolution(sim);
      expect(sim.lines).toHaveLength(level.solution.lines.length);
      play(sim);
      expect({ seed, phase: sim.phase, collected: sim.collected }).toMatchObject({ seed, phase: 'won' });
    }
  });

  it.each(levels)('$name: решение из подсказки даёт хотя бы две звезды', (level) => {
    const sim = new Simulation(level, 1);
    applySolution(sim);
    expect(starsFor(sim.inkUsed, level.ink)).toBeGreaterThanOrEqual(2);
  });
});
