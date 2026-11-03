// Тексты интерфейса и голос. Язык приходит из SDK при запуске: index.ts вызывает setLocale(sdk.locale).
import type { Locale } from '@ig/sdk';
import { useLanguage } from '../game/words';
import { en } from './en';
import { ro } from './ro';
import { ru, type Texts } from './ru';
import { uk } from './uk';

const TEXTS: Record<Locale, Texts> = { ru, uk, ro, en };
let current: Texts = ru;

/** Включает язык: тексты интерфейса, алфавит и слова. */
export function setLocale(locale: Locale) {
  current = TEXTS[locale] ?? ru;
  useLanguage(locale);
}
/** Тексты на текущем языке игры. */
export const tr = () => current;
export type { Texts };
