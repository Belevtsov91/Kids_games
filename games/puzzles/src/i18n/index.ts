// Тексты игры. Язык приходит из SDK при запуске: index.tsx вызывает setLocale(sdk.locale).
import type { Locale } from '@ig/sdk';
import { en } from './en';
import { ro } from './ro';
import { ru, type Texts } from './ru';
import { uk } from './uk';

const TEXTS: Record<Locale, Texts> = { ru, uk, ro, en };
let current: Texts = ru;

export const setLocale = (locale: Locale) => void (current = TEXTS[locale] ?? ru);
/** Тексты на текущем языке игры. */
export const tr = () => current;
/** Название встроенной картинки на текущем языке; у своих картинок — имя файла. */
export const puzzleTitle = (item: { id: string; title: string }) => current.titles[item.id] ?? item.title;
export type { Texts };
