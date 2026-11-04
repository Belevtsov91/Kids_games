// Прогресс: полка сказок (до 12 последних), сколько всего сочинено и какие герои уже были.
import { HEROES, readTale, type Hero, type Tale } from './story';

export const SHELF = 12;

export interface Progress {
  tales: Tale[];
  made: number;
  heroes: Hero[];
}

export const emptyProgress = (): Progress => ({ tales: [], made: 0, heroes: [] });

export const addTale = (p: Progress, t: Tale): Progress => ({
  tales: [t, ...p.tales].slice(0, SHELF),
  made: p.made + 1,
  heroes: p.heroes.includes(t.hero) ? p.heroes : [...p.heroes, t.hero],
});

export const allHeroes = (p: Progress) => HEROES.every((h) => p.heroes.includes(h));

export function readProgress(raw: unknown): Progress {
  const r = raw as Partial<Progress> | null;
  const tales = Array.isArray(r?.tales) ? r.tales.map(readTale).filter((t): t is Tale => t !== null).slice(0, SHELF) : [];
  const heroes = Array.isArray(r?.heroes) ? HEROES.filter((h) => (r.heroes as unknown[]).includes(h)) : [];
  return { tales, made: Math.max(tales.length, Math.floor(Number(r?.made) || 0)), heroes };
}
