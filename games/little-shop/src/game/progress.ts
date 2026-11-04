// Прогресс по трём прилавкам: уровень сложности и сколько всего верных ответов.
import { startAdapt, type Adapt } from './adapt';

export const STATIONS = ['scales', 'juice', 'cash'] as const;
export type Station = (typeof STATIONS)[number];
export const MAX_LEVEL: Record<Station, number> = { scales: 4, juice: 3, cash: 4 };

export interface Progress {
  adapt: Record<Station, Adapt>;
  wins: Record<Station, number>;
}

export const emptyProgress = (): Progress => ({
  adapt: { scales: startAdapt(), juice: startAdapt(), cash: startAdapt() },
  wins: { scales: 0, juice: 0, cash: 0 },
});

export function readProgress(raw: unknown): Progress {
  const r = raw as Partial<Progress> | null;
  const p = emptyProgress();
  for (const s of STATIONS) {
    const level = Math.floor(Number(r?.adapt?.[s]?.level));
    if (level >= 1 && level <= MAX_LEVEL[s]) p.adapt[s] = startAdapt(level);
    p.wins[s] = Math.max(0, Math.floor(Number(r?.wins?.[s]) || 0));
  }
  return p;
}
