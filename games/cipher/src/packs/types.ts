// Языковой набор игры: алфавит, таблица Морзе, слова для писем и загадки.
import type { MorseTable } from '../game/morse';

/** Слово для письма: заглавные буквы алфавита и картинка-подсказка после расшифровки. */
export interface Word {
  word: string;
  emoji: string;
}

/** Вариант ответа на загадку. */
export interface Choice {
  text: string;
  emoji: string;
}

/** Письмо-загадка: вопрос и варианты; первый вариант — верный (порядок перемешивает игра). */
export interface Riddle {
  question: string;
  choices: [Choice, Choice, Choice, Choice];
}

export interface Pack {
  /** Алфавит для колеса Цезаря, по порядку. */
  alphabet: string;
  morse: MorseTable;
  /** Слова от коротких к длинным: короткие идут в маяк, длинные — на колесо. */
  words: Word[];
  riddles: Riddle[];
}
