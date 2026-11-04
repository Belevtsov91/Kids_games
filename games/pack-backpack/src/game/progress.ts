// Прогресс: сколько раз собран рюкзак для каждой поездки. Поездки открываются по одной.
import { TRIPS } from './trips';

export interface Progress {
  done: Record<string, number>;
}

export const emptyProgress = (): Progress => ({ done: {} });

/** Первые три поездки открыты сразу, дальше — по одной за каждую новую собранную. */
export const isOpen = (p: Progress, index: number) => index < 3 || index < 3 + Object.keys(p.done).length;

export const recordTrip = (p: Progress, id: string): Progress => ({ done: { ...p.done, [id]: (p.done[id] ?? 0) + 1 } });

export function readProgress(raw: unknown): Progress {
  const done: Record<string, number> = {};
  const r = (raw as Partial<Progress> | null)?.done;
  for (const t of TRIPS) {
    const n = Math.floor(Number(r?.[t.id]));
    if (n > 0) done[t.id] = n;
  }
  return { done };
}
