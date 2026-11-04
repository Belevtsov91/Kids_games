// Прогресс: уровень (адаптивный) и рекорд — самый длинный поезд, который ребёнок запомнил.
import { startAdapt, type Adapt } from './adapt';
import { MAX_LEVEL, wagonsFor } from './train';

export interface Progress {
  adapt: Adapt;
  best: number;
  rides: number;
}

export const emptyProgress = (): Progress => ({ adapt: startAdapt(), best: 0, rides: 0 });

export const recordRide = (p: Progress, ok: boolean, adapt: Adapt, level: number): Progress => ({
  adapt,
  best: ok ? Math.max(p.best, wagonsFor(level)) : p.best,
  rides: p.rides + (ok ? 1 : 0),
});

export function readProgress(raw: unknown): Progress {
  const r = raw as Partial<Progress> | null;
  const level = Math.floor(Number(r?.adapt?.level));
  return {
    adapt: startAdapt(level >= 1 && level <= MAX_LEVEL ? level : 1),
    best: Math.min(6, Math.max(0, Math.floor(Number(r?.best) || 0))),
    rides: Math.max(0, Math.floor(Number(r?.rides) || 0)),
  };
}
