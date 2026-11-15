// Лучшие звёзды по районам. Хранится в sdk.storage, открытие районов — по порядку.
import { LEVELS } from './levels';

export type Stars = Record<number, number>;

export const SAVE_KEY = 'stars';

export function cleanStars(raw: unknown): Stars {
  const stars: Stars = {};
  if (!raw || typeof raw !== 'object') return stars;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const id = Number(key);
    if (LEVELS.some((l) => l.id === id) && typeof value === 'number' && value >= 1 && value <= 3) stars[id] = Math.floor(value);
  }
  return stars;
}

/** Открыт ли район: первый всегда, дальше — если прошлый уже зажжён. */
export function isOpen(stars: Stars, id: number) {
  const index = LEVELS.findIndex((l) => l.id === id);
  return index === 0 || (index > 0 && !!stars[LEVELS[index - 1].id]);
}

/** Запомнить результат: звёзды только растут. */
export const record = (stars: Stars, id: number, got: number): Stars => ({ ...stars, [id]: Math.max(stars[id] ?? 0, got) });

export const allLit = (stars: Stars) => LEVELS.every((l) => !!stars[l.id]);
export const perfectCount = (stars: Stars) => LEVELS.filter((l) => stars[l.id] === 3).length;
