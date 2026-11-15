// Языковые наборы. Язык выбирается при запуске вместе с текстами интерфейса.
import type { Locale } from '@ig/sdk';
import { en } from './en';
import { ro } from './ro';
import { ru } from './ru';
import type { Pack } from './types';
import { uk } from './uk';

export const PACKS: Record<Locale, Pack> = { ru, uk, ro, en };
export const packFor = (locale: Locale): Pack => PACKS[locale] ?? ru;
export type { Choice, Pack, Riddle, Word } from './types';
