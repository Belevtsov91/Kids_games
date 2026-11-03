// Тексты игры. Язык приходит из SDK при запуске: index.ts вызывает setLocale(sdk.locale).
import type { Locale } from '@ig/sdk';
import { en } from './en';
import { ro } from './ro';
import { ru, type Texts } from './ru';
import { uk } from './uk';

const TEXTS: Record<Locale, Texts> = { ru, uk, ro, en };
const DATE_LOCALE: Record<Locale, string> = { ru: 'ru-RU', uk: 'uk-UA', ro: 'ro-RO', en: 'en-GB' };
let locale: Locale = 'ru';

export const setLocale = (next: Locale) => void (locale = TEXTS[next] ? next : 'ru');
/** Тексты на текущем языке игры. */
export const tr = (): Texts => TEXTS[locale];
/** Дата для полки мелодий на языке игры. */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(DATE_LOCALE[locale], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export type { Texts };
