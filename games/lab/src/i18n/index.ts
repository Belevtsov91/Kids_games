// Тексты игры на четырёх языках. Язык приходит из SDK при запуске (sdk.locale).
import type { Locale } from '@ig/sdk';
import { en } from './en';
import { ro } from './ro';
import { ru, type Texts } from './ru';
import { uk } from './uk';

const TEXTS: Record<Locale, Texts> = { ru, uk, ro, en };

export const textsFor = (locale: Locale): Texts => TEXTS[locale] ?? ru;

/** Название и подсказка уровня; если перевода нет — русские. */
export const levelText = (t: Texts, id: string) => t.levels[id] ?? ru.levels[id] ?? [id, ''];
export type { Texts };
