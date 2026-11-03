// Тексты игры. Язык приходит из SDK при запуске: index.tsx вызывает setLocale(sdk.locale).
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
/** Название раскраски на текущем языке. */
export const pageTitle = (page: { id: string; title: string }) => TEXTS[locale].pages[page.id] ?? page.title;
/** Название нового рисунка: «Рисунок 3 ноября, 14:05» на языке игры. */
export const drawingTitle = (date = new Date()) => {
  const l = DATE_LOCALE[locale];
  return `${tr().drawing} ${date.toLocaleDateString(l, { day: 'numeric', month: 'long' })}, ${date.toLocaleTimeString(l, { hour: '2-digit', minute: '2-digit' })}`;
};
export type { Texts };
