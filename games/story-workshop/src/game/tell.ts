// Сказка словами: три фразы под три картинки комикса. Слова приходят из i18n, здесь только сборка.
import type { Hero, Item, Place, Tale, Twist } from './story';

export interface Words {
  heroes: Record<Hero, { name: string; a: string; the: string }>;
  places: Record<Place, { name: string; to: string }>;
  twists: Record<Twist, { name: string; line: string }>;
  items: Record<Item, { name: string; use: string }>;
  begin: (a: string, to: string) => string;
  end: (the: string, use: string) => string;
}

/** Три подписи: начало, середина, конец. */
export const tell = (t: Tale, w: Words): [string, string, string] => [
  w.begin(w.heroes[t.hero].a, w.places[t.place].to),
  w.twists[t.twist].line,
  w.end(w.heroes[t.hero].the, w.items[t.item].use),
];

/** Название сказки для полки: «Зайчик и фонарик». */
export const nameOf = (t: Tale, w: Words, and: string) => `${w.heroes[t.hero].name} ${and} ${w.items[t.item].name.toLowerCase()}`;
