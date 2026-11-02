// Все тексты, названия чисел и языки.
import type { Language } from './languages';
import type { Words } from './types';
import { en } from './words/en';
import { ro } from './words/ro';
import { ru } from './words/ru';
import { uk } from './words/uk';

export { languageNames, languages, locales, type Language } from './languages';
export { numberWord } from './numbers';
export type { Words } from './types';

export const words: Record<Language, Words> = { uk, ru, ro, en };
