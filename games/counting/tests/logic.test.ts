import { describe, expect, it } from 'vitest';
import { createQuestion, modes } from '../src/game/logic';
import { languages, numberWord, words } from '../src/i18n';
import { validateManifest } from '@ig/sdk';
import manifest from '../manifest';

describe('generated learning tasks', () => {
  it('keeps every task solvable, within the chosen range, with distinct choices', () => {
    for (const limit of [5, 10, 20])
      for (const mode of modes)
        for (let i = 0; i < 150; i++) {
          const q = createQuestion(mode, limit);
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThanOrEqual(limit);
          expect(q.options).toContain(q.answer);
          expect(new Set(q.options).size).toBe(4);
          if (mode === 'calculate') expect(q.answer).toBe(q.subtract ? q.a - q.b : q.a + q.b);
          if (mode === 'sequence') {
            expect(q.sequence[q.gap]).toBe(q.answer);
            expect(q.sequence.at(-1)).toBeLessThanOrEqual(limit);
          }
          if (mode === 'compare') expect(q.answer).toBe(q.a === q.b ? 0 : q.a > q.b ? 1 : 2);
        }
  });
  it('supplies all six modes and all number names in each language', () => {
    for (const language of languages) {
      expect(words[language].modes).toHaveLength(6);
      for (let n = 0; n <= 20; n++) expect(numberWord(language, n)).not.toBe(String(n));
    }
    expect(validateManifest(manifest, 'counting')).toEqual([]);
  });
});

describe('Session', () => {
  const seq = (values: number[]) => {
    let i = 0;
    return () => values[i++ % values.length];
  };

  it('звезда только за первую попытку, раунды идут по порядку', async () => {
    const { Session } = await import('../src/game/Session');
    const s = new Session('digit', 5, seq([0.1, 0.5, 0.9, 0.3]));
    const right = s.question.answer;
    expect(s.answer(right + 1 === 6 ? 0 : right + 1)).toBe('wrong');
    expect(s.answer(right)).toBe('right');
    expect(s.stars).toBe(0);
    expect(s.answer(right)).toBeNull();
    s.next();
    expect(s.round).toBe(2);
    expect(s.answer(s.question.answer)).toBe('right');
    expect(s.stars).toBe(1);
  });

  it('еда не выходит за пределы диапазона, предмет считается один раз', async () => {
    const { Session } = await import('../src/game/Session');
    const s = new Session('feed', 5);
    s.addFood(-1);
    expect(s.food).toBe(0);
    for (let i = 0; i < 9; i++) s.addFood(1);
    expect(s.food).toBe(5);
    expect(s.count(2)).toBe(true);
    expect(s.count(2)).toBe(false);
    s.clear();
    expect(s.food).toBe(0);
    expect(s.counted.size).toBe(0);
  });
});
