// Тексты игры и названия мест. Язык приходит из SDK при запуске: index.ts вызывает setLocale(sdk.locale).
import type { Locale } from '@ig/sdk';
import type { CountryId } from '../game/countries';
import { en as placesEn } from '../dict/en';
import { ro as placesRo } from '../dict/ro';
import { ru as placesRu, type Places } from '../dict/ru';
import { uk as placesUk } from '../dict/uk';
import { en } from './en';
import { ro } from './ro';
import { ru, type Texts } from './ru';
import { uk } from './uk';

const TEXTS: Record<Locale, Texts> = { ru, uk, ro, en };
const PLACES: Record<Locale, Places> = { ru: placesRu, uk: placesUk, ro: placesRo, en: placesEn };
let current: Texts = ru;
let places: Places = placesRu;

export const setLocale = (locale: Locale) => {
  current = TEXTS[locale] ?? ru;
  places = PLACES[locale] ?? placesRu;
};
export const tr = () => current;
export const nameOf = (id: CountryId) => places.countries[id][0];
export const capitalOf = (id: CountryId) => places.countries[id][1];
export const cityOf = (id: CountryId, n: number) => places.cities[id as keyof Places['cities']]?.[n] ?? capitalOf(id);
export type { Texts };
