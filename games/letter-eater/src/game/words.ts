// Слова с картинками и уровни. Буквы и слова зависят от языка игры (packs/), настройки уровней — общие.
import type { Locale } from '@ig/sdk';
import { PACKS, type Word } from './packs';

export type { Word };

export interface Level {
  id: number;
  title: string;
  emoji: string;
  /** Сколько слов собрать за уровень. */
  rounds: number;
  /** Сколько лишних букв летает рядом с нужными. */
  distractors: number;
  /** Лишние буквы похожи на нужные (Б/В, Ш/Щ…). */
  similar: boolean;
  /** В клетках слова видны бледные подсказки-буквы. */
  ghostLetters: boolean;
  /** Озвучивать слово в начале раунда. */
  speakAtStart: boolean;
  words: Word[];
}

/** Сложность уровней одинакова на всех языках. */
const SETTINGS: Omit<Level, 'title' | 'words'>[] = [
  { id: 1, emoji: '🌱', rounds: 5, distractors: 3, similar: false, ghostLetters: true, speakAtStart: true },
  { id: 2, emoji: '🌼', rounds: 5, distractors: 4, similar: false, ghostLetters: true, speakAtStart: true },
  { id: 3, emoji: '🌳', rounds: 6, distractors: 5, similar: false, ghostLetters: false, speakAtStart: true },
  { id: 4, emoji: '🚀', rounds: 6, distractors: 5, similar: true, ghostLetters: false, speakAtStart: false },
  { id: 5, emoji: '🏆', rounds: 6, distractors: 6, similar: true, ghostLetters: false, speakAtStart: false },
];

const levelsFor = (locale: Locale): Level[] =>
  SETTINGS.map((s, i) => ({ ...s, title: PACKS[locale].levels[i].title, words: PACKS[locale].levels[i].words }));

// Живые привязки ES-модулей: после useLanguage() все импортёры видят буквы и слова нового языка.
export let ALPHABET = PACKS.ru.alphabet;
export let SIMILAR = PACKS.ru.similar;
export let LETTER_NAMES = PACKS.ru.letterNames;
export let LEVELS: Level[] = levelsFor('ru');

/** Переключает буквы и слова на язык игры. Зовётся один раз при запуске. */
export function useLanguage(locale: Locale) {
  const pack = PACKS[locale] ?? PACKS.ru;
  ALPHABET = pack.alphabet;
  SIMILAR = pack.similar;
  LETTER_NAMES = pack.letterNames;
  LEVELS = levelsFor(PACKS[locale] ? locale : 'ru');
}
