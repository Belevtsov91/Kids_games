import { describe, expect, it } from 'vitest';
import { createQuestion, modes } from '../src/logic';
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
