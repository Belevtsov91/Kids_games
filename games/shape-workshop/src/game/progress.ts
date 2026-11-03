// Прогресс: какие картинки собраны и последняя своя постройка в свободной мастерской.
import { SHAPES, type Piece } from './shapes';
import { PICTURES } from './pictures';

export interface Progress {
  done: string[];
  free: Piece[];
}

export const FREE_MAX = 40;
export const emptyProgress = (): Progress => ({ done: [], free: [] });

/** Открыта ли картинка: первые три — сразу, дальше — по одной после каждой собранной. */
export const isOpen = (p: Progress, index: number) => index < 3 || index <= p.done.length + 2;

export const markDone = (p: Progress, id: string): Progress => (p.done.includes(id) ? p : { ...p, done: [...p.done, id] });

const num = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

export function readProgress(raw: unknown): Progress {
  const r = raw as Partial<Progress> | null;
  const ids = new Set(PICTURES.map((p) => p.id));
  const done = Array.isArray(r?.done) ? r.done.filter((id) => ids.has(id)) : [];
  const free = Array.isArray(r?.free)
    ? r.free.filter((f) => f && (SHAPES as readonly string[]).includes(f.type) && num(f.x, -20, 120) && num(f.y, -20, 120) && num(f.w, 1, 100) && num(f.h, 1, 100) && typeof f.color === 'string').slice(0, FREE_MAX)
    : [];
  return { done: [...new Set(done)], free };
}
