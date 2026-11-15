// Звёзды за уровень и сохранённый прогресс.
import type { Level } from './levels/types';

export interface RunResult {
  lit: boolean;
  star: boolean;
  /** Сколько деталей поставил игрок. */
  used: number;
}

/** 0–3 звезды: зажёг лампу, пролетел через звёздочку, уложился в число деталей. */
export function starsFor(level: Level, r: RunResult) {
  if (!r.lit) return 0;
  return 1 + (r.star ? 1 : 0) + (r.used <= level.par ? 1 : 0);
}

/** Лучшие звёзды по id уровня. */
export type Best = Record<string, number>;

export const recordBest = (best: Best, id: string, stars: number): Best =>
  stars > (best[id] ?? 0) ? { ...best, [id]: stars } : best;

/** Уровень открыт, если он первый или предыдущий пройден. */
export const isOpen = (levels: Level[], best: Best, index: number) => index === 0 || (best[levels[index - 1]?.id] ?? 0) > 0;

export const totalStars = (best: Best) => Object.values(best).reduce((sum, n) => sum + n, 0);

/** Сохранение из хранилища могло побиться: берём только числа 1–3. */
export function parseBest(raw: unknown): Best {
  if (!raw || typeof raw !== 'object') return {};
  const best: Best = {};
  for (const [id, n] of Object.entries(raw)) if (typeof n === 'number' && n >= 1 && n <= 3) best[id] = Math.floor(n);
  return best;
}
