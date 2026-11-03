import { describe, expect, it } from 'vitest';
import { parseKitchen, type Dir } from '../src/game/grid';
import { LEVELS } from '../src/game/levels';
import { compress, expand, nextTimes } from '../src/game/program';
import { emptyProgress, isUnlocked, readProgress, recordWin, starsFor } from '../src/game/progress';
import { simulate } from '../src/game/simulate';
import { hintFor, solve } from '../src/game/solver';

describe('кухня и программа', () => {
  const k = parseKitchen(['R.c.P']);
  it('разбирает карту', () => {
    expect(k.start).toEqual({ x: 0, y: 0 });
    expect(k.pot).toEqual({ x: 4, y: 0 });
    expect(k.food).toEqual([{ id: 'carrot', pos: { x: 2, y: 0 } }]);
  });
  it('разворачивает и сжимает повторы', () => {
    expect(expand([{ dir: 'right', times: 3 }, { dir: 'down', times: 1 }])).toEqual(['right', 'right', 'right', 'down']);
    expect(compress(['right', 'right', 'right', 'right'], true)).toEqual([{ dir: 'right', times: 3 }, { dir: 'right', times: 1 }]);
    expect(compress(['right', 'right'], false)).toHaveLength(2);
    expect(nextTimes(3)).toBe(1);
  });
  it('победа, удар о стену, не всё собрано', () => {
    expect(simulate(k, ['right', 'right', 'right', 'right']).outcome).toBe('win');
    expect(simulate(k, ['up']).outcome).toBe('bump');
    expect(simulate(parseKitchen(['Rc', 'P.']), ['down']).outcome).toBe('missing-food');
    expect(simulate(k, ['right', 'right']).outcome).toBe('not-at-pot');
  });
  it('подсказка показывает первое расхождение', () => {
    const sol: Dir[] = ['right', 'right', 'down'];
    expect(hintFor(sol, [{ dir: 'right', times: 2 }, { dir: 'up', times: 1 }])).toEqual({ keep: 1, next: 'down' });
    expect(hintFor(sol, [])).toEqual({ keep: 0, next: 'right' });
    expect(hintFor(sol, [{ dir: 'right', times: 1 }, { dir: 'right', times: 1 }])).toEqual({ keep: 2, next: 'down' });
    expect(hintFor(sol, [{ dir: 'right', times: 3 }])).toEqual({ keep: 0, next: 'right' });
  });
});
describe('уровни', () => {
  it.each(LEVELS.map((l) => [l.n, l] as const))('уровень %i проходим в отведённые команды', (_, level) => {
    const solution = solve(level.kitchen);
    expect(solution).not.toBeNull();
    expect(simulate(level.kitchen, solution!).outcome).toBe('win');
    expect(compress(solution!, level.repeat).length).toBeLessThanOrEqual(level.slots);
  });
});

describe('прогресс', () => {
  it('звёзды и открытие уровней', () => {
    expect(starsFor(1)).toBe(3);
    expect(starsFor(5)).toBe(1);
    let p = emptyProgress();
    expect(isUnlocked(p, 2)).toBe(false);
    p = recordWin(p, 1, 4);
    p = recordWin(p, 1, 1);
    expect(p.stars[1]).toBe(3);
    expect(isUnlocked(p, 2)).toBe(true);
    expect(readProgress({ stars: { 1: 9, 2: 2 } })).toEqual({ stars: { 2: 2 } });
    expect(readProgress(null)).toEqual(emptyProgress());
  });
});
