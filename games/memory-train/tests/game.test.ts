import { describe, expect, it } from 'vitest';
import { emptyProgress, readProgress, recordRide } from '../src/game/progress';
import { answerOf, makeRound, orderStepOk, wagonsFor } from '../src/game/train';

const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe('раунды', () => {
  it('на каждом уровне: разные пассажиры, верный ответ среди вариантов', () => {
    const r = rng(9);
    for (let level = 1; level <= 6; level++) {
      for (let i = 0; i < 60; i++) {
        const round = makeRound(level, r);
        expect(round.riders).toHaveLength(wagonsFor(level));
        expect(new Set(round.riders).size).toBe(round.riders.length);
        expect(new Set(round.options).size).toBe(round.options.length);
        const answer = answerOf(round);
        if (answer) expect(round.options).toContain(answer);
        else expect([...round.options].sort()).toEqual([...round.riders].sort());
        if (level === 1) expect(round.question.kind).toBe('which');
      }
    }
  });
  it('порядок проверяется по шагам', () => {
    const round = { riders: ['🐶', '🐱'], question: { kind: 'order' as const }, options: ['🐱', '🐶'], showMs: 0 };
    expect(orderStepOk(round, 0, '🐶')).toBe(true);
    expect(orderStepOk(round, 1, '🐶')).toBe(false);
  });
});

describe('прогресс', () => {
  it('рекорд и чтение', () => {
    const p = recordRide(emptyProgress(), true, { level: 3, streak: 0, misses: 0 }, 3);
    expect(p.best).toBe(4);
    expect(p.rides).toBe(1);
    expect(readProgress({ adapt: { level: 99 }, best: 40 })).toEqual({ adapt: { level: 1, streak: 0, misses: 0 }, best: 6, rides: 0 });
  });
});
