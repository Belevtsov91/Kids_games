import { ALPHABET, SIMILAR, type Level, type Word } from './words';

// Чистая логика игры без DOM: её проверяют тесты.

export type Rng = () => number;

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Слова на уровень: без повторов, в случайном порядке. */
export function pickWords(level: Level, rng: Rng = Math.random): Word[] {
  return shuffle(level.words, rng).slice(0, Math.min(level.rounds, level.words.length));
}

/** Лишние буквы: не встречаются в слове; на сложных уровнях сначала похожие на буквы слова. */
export function pickDistractors(word: string, count: number, similar: boolean, rng: Rng = Math.random): string[] {
  const inWord = new Set(word);
  const result: string[] = [];
  const take = (pool: Iterable<string>) => {
    for (const ch of pool) {
      if (result.length >= count) return;
      if (!inWord.has(ch) && !result.includes(ch)) result.push(ch);
    }
  };
  if (similar) take(shuffle([...new Set([...word].flatMap((ch) => [...(SIMILAR[ch] ?? '')]))], rng));
  // Твёрдый знак ребёнку подсовывать не будем: он почти не встречается в простых словах.
  take(shuffle([...ALPHABET].filter((ch) => ch !== 'Ъ'), rng));
  return result;
}

export interface Bubble {
  id: number;
  letter: string;
}

/** Пузыри с буквами для раунда: каждая буква слова отдельно (повторы тоже) плюс лишние. */
export function buildBubbles(word: string, level: Pick<Level, 'distractors' | 'similar'>, rng: Rng = Math.random): Bubble[] {
  const letters = [...word, ...pickDistractors(word, level.distractors, level.similar, rng)];
  return shuffle(letters, rng).map((letter, id) => ({ id, letter }));
}

export type TapResult = 'correct' | 'wrong' | 'done';

/** Состояние одного слова: сколько букв уже съедено и сколько было ошибок. */
export class Round {
  eaten = 0;
  mistakes = 0;

  constructor(readonly word: string) {}

  get expected(): string | null {
    return this.word[this.eaten] ?? null;
  }

  get finished() {
    return this.eaten >= this.word.length;
  }

  tap(letter: string): TapResult {
    if (this.finished) return 'done';
    if (letter !== this.expected) {
      this.mistakes++;
      return 'wrong';
    }
    this.eaten++;
    return this.finished ? 'done' : 'correct';
  }
}

/** Звёзды за уровень по числу ошибок на слово: 0–0.5 → 3, до 1.5 → 2, иначе 1. */
export function starsFor(mistakes: number, words: number): 1 | 2 | 3 {
  const perWord = words > 0 ? mistakes / words : 0;
  if (perWord <= 0.5) return 3;
  if (perWord <= 1.5) return 2;
  return 1;
}

/** Уровень открыт, если это первый или за предыдущий есть хотя бы одна звезда. */
export function isUnlocked(levelIndex: number, stars: readonly number[]) {
  return levelIndex === 0 || (stars[levelIndex - 1] ?? 0) > 0;
}

/**
 * Места для пузырей на поле: сетка с небольшим разбросом, чтобы буквы не налезали друг на друга.
 * Координаты — доли ширины и высоты поля (0…1), центр пузыря.
 */
export function layoutBubbles(count: number, aspect: number, rng: Rng = Math.random): { x: number; y: number }[] {
  const cols = Math.max(1, Math.min(count, Math.round(Math.sqrt(count * aspect))));
  const rows = Math.ceil(count / cols);
  const cells = shuffle(Array.from({ length: cols * rows }, (_, i) => i), rng).slice(0, count);
  return cells.map((cell) => {
    const col = cell % cols;
    const row = Math.floor(cell / cols);
    const jitter = () => (rng() - 0.5) * 0.4;
    return { x: (col + 0.5 + jitter()) / cols, y: (row + 0.5 + jitter()) / rows };
  });
}
