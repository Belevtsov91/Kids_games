import { describe, expect, it } from 'vitest';
import { buildBubbles, isUnlocked, layoutBubbles, pickDistractors, pickWords, Round, starsFor } from '../src/logic';
import { ALPHABET, LETTER_NAMES, LEVELS } from '../src/words';
import { LEVEL_COUNT } from '../server/repository';

/** Детерминированный генератор, чтобы тесты не зависели от случайности. */
function seeded(seed = 42) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

describe('слова и уровни', () => {
  it('все слова из русских заглавных букв, без Ё, и у каждой буквы есть название', () => {
    for (const level of LEVELS) {
      for (const { word, emoji } of level.words) {
        expect(word).toMatch(/^[А-ЯЁ]+$/);
        expect(word).not.toContain('Ё');
        expect(emoji).not.toBe('');
      }
    }
    for (const ch of ALPHABET) expect(LETTER_NAMES[ch]).toBeTruthy();
  });

  it('слов хватает на раунды, а сервер знает столько же уровней', () => {
    for (const level of LEVELS) expect(level.words.length).toBeGreaterThanOrEqual(level.rounds);
    expect(LEVELS).toHaveLength(LEVEL_COUNT);
  });

  it('слова уровня не повторяются', () => {
    const words = pickWords(LEVELS[0], seeded());
    expect(words).toHaveLength(LEVELS[0].rounds);
    expect(new Set(words.map((w) => w.word)).size).toBe(words.length);
  });
});

describe('пузыри с буквами', () => {
  it('лишние буквы не встречаются в слове и не повторяются', () => {
    for (let seed = 1; seed < 50; seed++) {
      const extra = pickDistractors('КОАЛА', 6, true, seeded(seed));
      expect(extra).toHaveLength(6);
      expect(new Set(extra).size).toBe(6);
      for (const ch of extra) expect('КОАЛА').not.toContain(ch);
    }
  });

  it('на сложных уровнях лишние буквы похожи на буквы слова', () => {
    const extra = pickDistractors('Ш', 2, true, seeded());
    expect(extra.every((ch) => 'ЩИМ'.includes(ch))).toBe(true);
  });

  it('каждая буква слова есть отдельным пузырём, включая повторы', () => {
    const bubbles = buildBubbles('КОАЛА', { distractors: 4, similar: false }, seeded());
    expect(bubbles).toHaveLength(9);
    expect(bubbles.filter((b) => b.letter === 'А')).toHaveLength(2);
    expect(new Set(bubbles.map((b) => b.id)).size).toBe(9);
  });

  it('места пузырей внутри поля и не совпадают', () => {
    const spots = layoutBubbles(14, 1.6, seeded());
    expect(spots).toHaveLength(14);
    for (const { x, y } of spots) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(1);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(1);
    }
    expect(new Set(spots.map((p) => `${p.x}:${p.y}`)).size).toBe(14);
  });
});

describe('раунд', () => {
  it('буквы съедаются по порядку, ошибки считаются', () => {
    const round = new Round('КОТ');
    expect(round.tap('О')).toBe('wrong');
    expect(round.tap('К')).toBe('correct');
    expect(round.tap('О')).toBe('correct');
    expect(round.expected).toBe('Т');
    expect(round.tap('Т')).toBe('done');
    expect(round.finished).toBe(true);
    expect(round.mistakes).toBe(1);
    expect(round.tap('Т')).toBe('done');
  });

  it('звёзды по ошибкам на слово', () => {
    expect(starsFor(0, 5)).toBe(3);
    expect(starsFor(2, 5)).toBe(3);
    expect(starsFor(7, 5)).toBe(2);
    expect(starsFor(20, 5)).toBe(1);
  });

  it('следующий уровень открывается после звезды за предыдущий', () => {
    expect(isUnlocked(0, [0, 0])).toBe(true);
    expect(isUnlocked(1, [0, 0])).toBe(false);
    expect(isUnlocked(1, [2, 0])).toBe(true);
  });
});
