// Сохранение: звёзды за маршруты, сколько флагов угадано, какие страны уже посещены.
import { COUNTRY_IDS, REGIONS, type CountryId, type Region } from './countries';

export interface Progress {
  stars: Record<Region, number>;
  flags: number;
  visited: CountryId[];
}

export const emptyProgress = (): Progress => ({ stars: { home: 0, europe: 0, world: 0 }, flags: 0, visited: [] });

const isCountry = (v: unknown): v is CountryId => (COUNTRY_IDS as readonly unknown[]).includes(v);
const count = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : 0);

/** Читает сохранение осторожно: старое или испорченное превращается в пустое, а не роняет игру. */
export const readProgress = (raw: unknown): Progress => {
  const base = emptyProgress();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<Record<keyof Progress, unknown>>;
  const stars = (r.stars && typeof r.stars === 'object' ? r.stars : {}) as Record<string, unknown>;
  for (const region of REGIONS) base.stars[region] = count(stars[region], 3);
  base.flags = count(r.flags, 1_000_000);
  base.visited = Array.isArray(r.visited) ? [...new Set(r.visited.filter(isCountry))] : [];
  return base;
};

/** Маршрут открыт: дом — всегда, Европа — после звезды дома, мир — после звезды в Европе. */
export const isOpen = (region: Region, p: Progress) =>
  region === 'home' || (region === 'europe' ? p.stars.home > 0 : p.stars.europe > 0);

export interface RoundResult {
  region: Region;
  correct: number;
  total: number;
  stars: number;
  flagsRight: number;
  visited: CountryId[];
}

/** Записывает итог маршрута: лучшие звёзды остаются, флаги и посещённые страны копятся. */
export const recordRound = (p: Progress, r: RoundResult): Progress => ({
  stars: { ...p.stars, [r.region]: Math.max(p.stars[r.region], r.stars) },
  flags: p.flags + r.flagsRight,
  visited: [...new Set([...p.visited, ...r.visited])],
});

export const FLAG_MASTER = 30;

/** Какие наклейки заслужены после маршрута. */
export const stickersFor = (p: Progress, r: RoundResult): string[] => {
  const out = ['first-flight'];
  if (r.stars > 0) out.push(`${r.region}-route`);
  if (r.correct === r.total) out.push('perfect-route');
  if (p.flags >= FLAG_MASTER) out.push('flag-master');
  if (REGIONS.every((region) => p.stars[region] === 3)) out.push('globe-trotter');
  return out;
};
