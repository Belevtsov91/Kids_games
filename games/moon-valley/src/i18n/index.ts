// Язык игры приходит от оболочки (sdk.locale) при запуске; тексты берутся через tr().

import type { Locale } from '@ig/sdk';
import { en } from './en';
import { ro } from './ro';
import { ru, type Texts } from './ru';
import { uk } from './uk';

const TEXTS: Record<Locale, Texts> = { ru, uk, ro, en };
let current: Texts = ru;

export function setLocale(locale: Locale | undefined) {
  current = (locale && TEXTS[locale]) || ru;
}

export const tr = (): Texts => current;

/** Строка помощи: части в квадратных скобках (нечётные) — клавиши. */
export const keyParts = (line: string) => line.split(/\[(.+?)\]/);
