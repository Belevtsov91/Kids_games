// Раунды: какие письма придут в «мешке почты» и насколько они трудные.
// Трудность растёт с номером мешка (tier), который игра хранит отдельно для каждого режима.
import type { Choice, Pack, Word } from '../packs';
import { encode, lettersOf } from './caesar';
import type { MorseTable } from './morse';

export type Rng = () => number;
export type Mode = 'wheel' | 'lighthouse' | 'riddle';
export const MODES: readonly Mode[] = ['wheel', 'lighthouse', 'riddle'];

/** Писем в одном мешке. */
export const BAG_SIZE = 5;

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Слова нужной длины; если их меньше, чем нужно, слова повторяются в новом порядке. */
export function pickWords(words: readonly Word[], minLen: number, maxLen: number, count: number, rng: Rng): Word[] {
  const fitting = words.filter(({ word }) => Array.from(word).length >= minLen && Array.from(word).length <= maxLen);
  const pool = fitting.length ? fitting : [...words];
  const picked: Word[] = [];
  while (picked.length < count) picked.push(...shuffle(pool, rng));
  return picked.slice(0, count);
}

export interface WheelLevel {
  minLen: number;
  maxLen: number;
  /** Наибольший ключ; наименьший всегда 1. */
  maxKey: number;
  /** Ключ написан на конверте; иначе его надо подобрать. */
  keyKnown: boolean;
}

export function wheelLevel(tier: number, alphabet: string): WheelLevel {
  if (tier <= 0) return { minLen: 3, maxLen: 4, maxKey: 3, keyKnown: true };
  if (tier === 1) return { minLen: 4, maxLen: 5, maxKey: 8, keyKnown: true };
  return { minLen: 5, maxLen: 6, maxKey: lettersOf(alphabet).length - 1, keyKnown: false };
}

export interface WheelRound extends Word {
  key: number;
  cipher: string;
  keyKnown: boolean;
}

export function makeWheelRounds(pack: Pack, tier: number, rng: Rng, count = BAG_SIZE): WheelRound[] {
  const level = wheelLevel(tier, pack.alphabet);
  return pickWords(pack.words, level.minLen, level.maxLen, count, rng).map((w) => {
    const key = 1 + Math.floor(rng() * level.maxKey);
    return { ...w, key, cipher: encode(w.word, key, pack.alphabet), keyKnown: level.keyKnown };
  });
}

export interface LighthouseLevel {
  minLen: number;
  maxLen: number;
  /** Сколько букв на выбор. */
  options: number;
  /** Показывать всю таблицу Морзе вместо кодов только для вариантов. */
  fullBook: boolean;
}

export function lighthouseLevel(tier: number): LighthouseLevel {
  if (tier <= 0) return { minLen: 3, maxLen: 3, options: 3, fullBook: false };
  if (tier === 1) return { minLen: 3, maxLen: 4, options: 4, fullBook: false };
  return { minLen: 4, maxLen: 5, options: 4, fullBook: true };
}

export function makeLighthouseRounds(pack: Pack, tier: number, rng: Rng, count = BAG_SIZE): Word[] {
  const level = lighthouseLevel(tier);
  const transmittable = pack.words.filter(({ word }) => Array.from(word).every((l) => l in pack.morse));
  return pickWords(transmittable, level.minLen, level.maxLen, count, rng);
}

/** Варианты букв для одного сигнала: верная плюс другие буквы таблицы, без повторов. */
export function letterOptions(letter: string, table: MorseTable, count: number, rng: Rng): string[] {
  const others = shuffle(Object.keys(table).filter((l) => l !== letter), rng).slice(0, count - 1);
  return shuffle([letter, ...others], rng);
}

export interface RiddleRound {
  question: string;
  choices: Choice[];
  /** Номер верного варианта после перемешивания. */
  answer: number;
}

export function makeRiddleRounds(pack: Pack, rng: Rng, count = BAG_SIZE): RiddleRound[] {
  return shuffle(pack.riddles, rng)
    .slice(0, count)
    .map(({ question, choices }) => {
      const mixed = shuffle(choices, rng);
      return { question, choices: mixed, answer: mixed.indexOf(choices[0]) };
    });
}

/** Звёзды за мешок по числу ошибок. */
export const starsFor = (mistakes: number) => (mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1);
