// Поездки: что обязательно взять и что брать не нужно. Без DOM — покрыто тестами.

export const ITEM_ART: Record<string, string> = {
  umbrella: '☂️', coat: '🧥', boots: '👢', swimsuit: '🩱', sunglasses: '🕶️', sunhat: '👒', sunscreen: '🧴',
  bucket: '🪣', mittens: '🧤', scarf: '🧣', sled: '🛷', snack: '🍎', water: '🥤', pencils: '✏️', teddy: '🧸',
  book: '📚', toothbrush: '🪥', torch: '🔦', map: '🗺️', compass: '🧭', ball: '⚽', flipflops: '🩴', skates: '⛸️', kite: '🪁',
};

export interface Trip {
  id: string;
  art: string;
  need: readonly string[];
  /** Что не подходит — из этого набираются лишние вещи на полке. */
  wrong: readonly string[];
}

export const TRIPS: readonly Trip[] = [
  { id: 'rain', art: '🌧️', need: ['umbrella', 'coat', 'boots'], wrong: ['swimsuit', 'sunglasses', 'flipflops', 'sled', 'kite', 'sunscreen'] },
  { id: 'beach', art: '🏖️', need: ['swimsuit', 'sunhat', 'sunglasses', 'bucket'], wrong: ['mittens', 'scarf', 'sled', 'boots', 'skates', 'coat'] },
  { id: 'snow', art: '❄️', need: ['coat', 'mittens', 'scarf', 'boots', 'sled'], wrong: ['swimsuit', 'flipflops', 'sunscreen', 'bucket', 'sunglasses', 'kite'] },
  { id: 'kindergarten', art: '🏫', need: ['snack', 'water', 'pencils'], wrong: ['sled', 'swimsuit', 'compass', 'torch', 'skates'] },
  { id: 'hike', art: '⛰️', need: ['map', 'compass', 'torch', 'water', 'snack'], wrong: ['skates', 'swimsuit', 'bucket', 'teddy', 'flipflops'] },
  { id: 'sleepover', art: '🌙', need: ['toothbrush', 'teddy', 'book'], wrong: ['sled', 'swimsuit', 'map', 'kite', 'skates', 'sunscreen'] },
  { id: 'windy', art: '🌬️', need: ['kite', 'coat', 'ball'], wrong: ['swimsuit', 'flipflops', 'sled', 'umbrella', 'sunscreen'] },
  { id: 'rink', art: '⛸️', need: ['skates', 'mittens', 'scarf', 'coat'], wrong: ['swimsuit', 'flipflops', 'bucket', 'sunhat', 'kite'] },
];

export type Rand = () => number;

const shuffle = <T>(items: readonly T[], rand: Rand) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Сколько лишних вещей на полке: на первом рюкзаке поездки — 2, потом больше. */
export const extrasFor = (timesDone: number) => Math.min(5, 2 + timesDone);

/** Полка: всё нужное и несколько лишних, вперемешку. */
export function buildShelf(trip: Trip, extras: number, rand: Rand): string[] {
  return shuffle([...trip.need, ...shuffle(trip.wrong, rand).slice(0, extras)], rand);
}

export type PackResult = 'packed' | 'wrong' | 'already';

/** Положить вещь: нужная — в рюкзак, лишняя — нет. */
export function pack(trip: Trip, packed: ReadonlySet<string>, item: string): PackResult {
  if (packed.has(item)) return 'already';
  return trip.need.includes(item) ? 'packed' : 'wrong';
}

export const isReady = (trip: Trip, packed: ReadonlySet<string>) => trip.need.every((i) => packed.has(i));
