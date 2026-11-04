// Прогресс: уровень загадок, какие сезоны ребёнок открыл в саду и сколько загадок отгадал.
import { startAdapt, type Adapt } from './adapt';
import { isSeason, SEASONS, type Season } from './seasons';
import { MAX_LEVEL } from './things';

export interface Progress {
  adapt: Adapt;
  seen: Season[];
  solved: number;
}

export const emptyProgress = (): Progress => ({ adapt: startAdapt(), seen: [], solved: 0 });

export const seeSeason = (p: Progress, s: Season): Progress => (p.seen.includes(s) ? p : { ...p, seen: [...p.seen, s] });

export const allSeen = (p: Progress) => SEASONS.every((s) => p.seen.includes(s));

export const recordAnswer = (p: Progress, ok: boolean, adapt: Adapt): Progress => ({ ...p, adapt, solved: p.solved + (ok ? 1 : 0) });

export function readProgress(raw: unknown): Progress {
  const r = raw as Partial<Progress> | null;
  const level = Math.floor(Number(r?.adapt?.level));
  return {
    adapt: startAdapt(level >= 1 && level <= MAX_LEVEL ? level : 1),
    seen: Array.isArray(r?.seen) ? SEASONS.filter((s) => (r.seen as unknown[]).includes(s) && isSeason(s)) : [],
    solved: Math.max(0, Math.floor(Number(r?.solved) || 0)),
  };
}
