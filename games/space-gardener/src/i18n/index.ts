// Тексты игры. Язык приходит из SDK при запуске: index.ts вызывает setLocale(sdk.locale).
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
/** Название и подсказка уровня на текущем языке. */
export const levelText = (level: { id: string; name: string; tip: string }) => {
  const [name, tip] = current.levels[level.id] ?? [level.name, level.tip];
  return { name, tip };
};
export type { Texts };
