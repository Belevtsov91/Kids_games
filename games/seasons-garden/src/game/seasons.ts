// Времена года и погода: что происходит в саду. Чистая логика без DOM.

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export const WEATHERS = ['sun', 'rain', 'snow', 'wind'] as const;
export const ANIMALS = ['bear', 'bird', 'squirrel', 'hedgehog'] as const;

export type Season = (typeof SEASONS)[number];
export type Weather = (typeof WEATHERS)[number];
export type Animal = (typeof ANIMALS)[number];

/** Снег бывает только зимой, дождь зимой превращается в снег. */
export const weatherOk = (s: Season, w: Weather) => (w === 'snow' ? s === 'winter' : w === 'rain' ? s !== 'winter' : true);

/** Погода по умолчанию, когда ребёнок переключил сезон и прежняя погода не подходит. */
export const fixWeather = (s: Season, w: Weather): Weather => (weatherOk(s, w) ? w : s === 'winter' ? 'snow' : 'sun');

export const nextSeason = (s: Season): Season => SEASONS[(SEASONS.indexOf(s) + 1) % SEASONS.length]!;

export type Tree = 'blossom' | 'green' | 'yellow' | 'bare';
export type Ground = 'sprouts' | 'grass' | 'leaves' | 'snow';
export type AnimalState = 'awake' | 'asleep' | 'away' | 'busy' | 'hidden';

export interface Scene {
  season: Season;
  weather: Weather;
  tree: Tree;
  ground: Ground;
  animals: Record<Animal, AnimalState>;
  /** Что ещё видно в саду: подсолнух летом, грибы осенью, снеговик зимой. */
  extras: string[];
}

const TREE: Record<Season, Tree> = { spring: 'blossom', summer: 'green', autumn: 'yellow', winter: 'bare' };
const GROUND: Record<Season, Ground> = { spring: 'sprouts', summer: 'grass', autumn: 'leaves', winter: 'snow' };
const EXTRAS: Record<Season, string[]> = {
  spring: ['🌷', '🪺'],
  summer: ['🌻', '🦋', '🍓'],
  autumn: ['🍄', '🎃', '🍂'],
  winter: ['⛄'],
};

/** Как живут звери: медведь и ёжик зимой спят, птицы осенью улетают, белка осенью запасает орехи. */
export function animalState(a: Animal, s: Season, w: Weather): AnimalState {
  if (a === 'bear' || a === 'hedgehog') return s === 'winter' ? 'asleep' : s === 'autumn' ? 'busy' : w === 'rain' ? 'hidden' : 'awake';
  if (a === 'bird') return s === 'winter' ? 'away' : s === 'spring' ? 'busy' : w === 'rain' || w === 'wind' ? 'hidden' : 'awake';
  return s === 'autumn' ? 'busy' : w === 'rain' || w === 'wind' ? 'hidden' : 'awake';
}

export function sceneOf(season: Season, wanted: Weather): Scene {
  const weather = fixWeather(season, wanted);
  const animals = Object.fromEntries(ANIMALS.map((a) => [a, animalState(a, season, weather)])) as Record<Animal, AnimalState>;
  return { season, weather, tree: TREE[season], ground: GROUND[season], animals, extras: EXTRAS[season] };
}

export const isSeason = (v: unknown): v is Season => typeof v === 'string' && (SEASONS as readonly string[]).includes(v);
