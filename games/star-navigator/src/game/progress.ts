// Прогресс штурмана: звёзды по уровням. Следующий уровень открывается, когда пройден предыдущий.
import { LEVELS } from './levels';

export interface Progress {
  /** Лучшие звёзды (1–3) по id уровня. */
  stars: Record<string, number>;
}

export const emptyProgress = (): Progress => ({ stars: {} });

/** Сохранение могло испортиться или прийти от старой версии — берём только понятное. */
export const readProgress = (raw: unknown): Progress => {
  const stars: Record<string, number> = {};
  const src = (raw as { stars?: unknown } | null)?.stars;
  if (src && typeof src === 'object') {
    for (const l of LEVELS) {
      const v = (src as Record<string, unknown>)[l.id];
      if (typeof v === 'number' && v >= 1 && v <= 3) stars[l.id] = Math.floor(v);
    }
  }
  return { stars };
};

/** Звёзды за полёт: долетел, собрал все кристаллы, справился не больше чем за три попытки. */
export const starsFor = (crystalsGot: number, crystalsTotal: number, attempts: number) =>
  1 + (crystalsGot >= crystalsTotal ? 1 : 0) + (attempts <= 3 ? 1 : 0);

export const isUnlocked = (p: Progress, index: number) => index === 0 || (LEVELS[index - 1] !== undefined && LEVELS[index - 1].id in p.stars);

export const totalStars = (p: Progress) => Object.values(p.stars).reduce((s, n) => s + n, 0);

/** Записать результат: лучшие звёзды остаются. Возвращает новый прогресс и признак рекорда. */
export const recordWin = (p: Progress, id: string, stars: number) => {
  const best = Math.max(p.stars[id] ?? 0, stars);
  return { progress: { stars: { ...p.stars, [id]: best } }, improved: best > (p.stars[id] ?? 0) };
};

export const allDone = (p: Progress) => LEVELS.every((l) => l.id in p.stars);
