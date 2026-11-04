// Тексты и озвучка игры. Язык приходит из SDK при запуске: index.ts вызывает setLocale(sdk.locale).
import type { Locale } from '@ig/sdk';
import { en } from './en';
import { ro } from './ro';
import { ru, type Texts } from './ru';
import { uk } from './uk';

const TEXTS: Record<Locale, Texts> = { ru, uk, ro, en };
let current: Texts = ru;

export const setLocale = (locale: Locale) => void (current = TEXTS[locale] ?? ru);
export const tr = () => current;
export type { Texts };
