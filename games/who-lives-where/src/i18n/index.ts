// Тексты и озвучка игры. Язык приходит из SDK при запуске: index.ts вызывает setLocale(sdk.locale).
import type { Locale } from '@ig/sdk';
import type { Animal, Habitat } from '../game/data';
import { en } from './en';
import { ro } from './ro';
import { ru, type Texts } from './ru';
import { uk } from './uk';

const TEXTS: Record<Locale, Texts> = { ru, uk, ro, en };
let current: Texts = ru;

export const setLocale = (locale: Locale) => void (current = TEXTS[locale] ?? ru);
/** Тексты на текущем языке игры. */
export const tr = () => current;
export const animalName = (a: Animal) => current.animals[a.id] ?? a.name;
export const homeTitle = (h: Habitat) => current.homes[h.id]?.[0] ?? h.title;
/** «на ферме», «у лісі», «in the sea» — продолжение фразы «… живёт …». */
export const homeWhere = (h: Habitat) => current.homes[h.id]?.[1] ?? h.where;
export type { Texts };
