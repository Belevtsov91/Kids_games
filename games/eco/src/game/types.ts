// Правила энергии Эко-города: что умеют постройки и сколько тратят дома. Чистые данные, без DOM.

/** Клетка острова. '.' трава, '^' холм (ветер сильнее), 't' роща (тень для панелей), '~' вода. */
export type Terrain = 'grass' | 'hill' | 'grove' | 'water';
/** Потребители, стоят на карте с начала уровня. */
export type HouseKind = 'house' | 'tower' | 'school';
/** То, что ставит игрок. */
export type Tool = 'solar' | 'wind' | 'battery';

export const TOOLS: readonly Tool[] = ['solar', 'wind', 'battery'];

/** Цена в монетках. */
export const COST: Record<Tool, number> = { solar: 3, wind: 4, battery: 3 };

/** Сколько энергии вмещает одна батарея. */
export const BATTERY_CAPACITY = 10;

/** Холм усиливает ветряк, роща затеняет панель. */
export const HILL_WIND = 1.5;
export const GROVE_SUN = 0.5;
/** Мощность ветряка при ветре 1. */
export const WIND_POWER = 2;

/** Солнце в ясный день по часам 0–23: встаёт в 6, садится к 18. */
export const SUN: readonly number[] = [0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 4, 4, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0];

/** Расход по часам 0–23. Дом: утром и вечером больше. Школа: только днём. */
export const DEMAND: Record<HouseKind, readonly number[]> = {
  house: [1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 3, 3, 2, 1, 1],
  tower: [2, 2, 2, 2, 2, 2, 2, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 4, 6, 6, 6, 4, 2, 2],
  school: [0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

/** Профили ветра: сила 0–1 по часам. */
export type WindKind = 'none' | 'steady' | 'night' | 'morning' | 'gusty';

const series = (fn: (h: number) => number) => Array.from({ length: 24 }, (_, h) => fn(h));
export const WIND: Record<WindKind, readonly number[]> = {
  none: series(() => 0),
  steady: series(() => 0.5),
  night: series((h) => (h >= 20 || h < 6 ? 0.8 : 0.2)),
  morning: series((h) => (h >= 3 && h < 12 ? 1 : 0.1)),
  gusty: series((h) => (h % 3 === 0 ? 0.9 : 0.3)),
};

/** Клетка карты после разбора уровня. */
export interface Cell {
  terrain: Terrain;
  house?: HouseKind;
}

export interface Level {
  id: number;
  /** Ключ текстов уровня в словаре. */
  key: string;
  /** Строки карты: . ^ t ~ трава/холм/роща/вода; h дом, H высотка, s школа. */
  map: readonly string[];
  tools: readonly Tool[];
  /** Ясность неба: 1 солнечно, 0.5 облачно. */
  sun: number;
  wind: WindKind;
  /** Монетки на стройку. */
  budget: number;
}

/** Постройки игрока: номер клетки → что стоит. */
export type Layout = Record<number, Tool>;

/** Порядок часов при показе: день начинается с рассвета. */
export const DAY_START = 6;
export const HOURS: readonly number[] = series((i) => (i + DAY_START) % 24);
