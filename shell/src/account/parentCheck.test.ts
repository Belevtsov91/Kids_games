import { describe, expect, it } from 'vitest';
import { allCorrect, makeProblems } from './parentCheck';

describe('проверка «только для взрослых»', () => {
  it('три примера с целыми положительными ответами', () => {
    for (let i = 0; i < 200; i++) {
      const problems = makeProblems();
      expect(problems).toHaveLength(3);
      for (const p of problems) {
        expect(Number.isInteger(p.answer)).toBe(true);
        expect(p.answer).toBeGreaterThan(0);
      }
    }
  });

  it('принимает только все верные ответы', () => {
    const problems = makeProblems();
    const right = problems.map((p) => ` ${p.answer} `);
    expect(allCorrect(problems, right)).toBe(true);
    expect(allCorrect(problems, [right[0], right[1], String(problems[2].answer + 1)])).toBe(false);
    expect(allCorrect(problems, [right[0], right[1], ''])).toBe(false);
  });
});
