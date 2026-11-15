// Прогресс: лучшие звёзды за каждую главу. Все главы открыты сразу — дети 4–8 лет выбирают сами.
import { CHAPTERS, type ChapterId } from './rounds';

export interface Progress {
  stars: Partial<Record<ChapterId, number>>;
}

export const emptyProgress = (): Progress => ({ stars: {} });

export const recordChapter = (p: Progress, id: ChapterId, stars: number): Progress => ({
  stars: { ...p.stars, [id]: Math.max(p.stars[id] ?? 0, stars) },
});

/** Все главы пройдены на три звезды — «Знаток дороги». */
export const isHero = (p: Progress) => CHAPTERS.every((c) => p.stars[c.id] === 3);

export function readProgress(raw: unknown): Progress {
  const stars: Progress['stars'] = {};
  const r = (raw as Partial<Progress> | null)?.stars as Record<string, unknown> | undefined;
  for (const c of CHAPTERS) {
    const n = Math.floor(Number(r?.[c.id]));
    if (n >= 1 && n <= 3) stars[c.id] = n;
  }
  return { stars };
}
