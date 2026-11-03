// Прогон программы: робот шагает по кухне, собирает продукты и в конце должен стоять у кастрюли.
import { isFree, key, move, type Dir, type Kitchen, type Pos } from './grid';

export type StepEvent =
  | { kind: 'move'; dir: Dir; to: Pos; picked: string | null }
  | { kind: 'bump'; dir: Dir; at: Pos };

export type Outcome = 'win' | 'bump' | 'missing-food' | 'not-at-pot';

export interface Run {
  events: StepEvent[];
  outcome: Outcome;
  /** Сколько продуктов собрано к концу. */
  collected: number;
}

export function simulate(kitchen: Kitchen, steps: readonly Dir[]): Run {
  let pos = kitchen.start;
  const left = new Map(kitchen.food.map((f) => [key(f.pos), f.id]));
  const events: StepEvent[] = [];
  for (const dir of steps) {
    const next = move(pos, dir);
    if (!isFree(kitchen, next)) {
      events.push({ kind: 'bump', dir, at: pos });
      return { events, outcome: 'bump', collected: kitchen.food.length - left.size };
    }
    pos = next;
    const picked = left.get(key(pos)) ?? null;
    if (picked) left.delete(key(pos));
    events.push({ kind: 'move', dir, to: pos, picked });
  }
  const collected = kitchen.food.length - left.size;
  if (left.size) return { events, outcome: 'missing-food', collected };
  if (key(pos) !== key(kitchen.pot)) return { events, outcome: 'not-at-pot', collected };
  return { events, outcome: 'win', collected };
}
