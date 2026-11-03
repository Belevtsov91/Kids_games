import type { GameDb } from '@ig/sdk/server';

// Звёзды по уровням для каждого ребёнка. С БД — таблица ig_game_letter_eater_progress (migrations/),
// без БД (тесты, запуск без Supabase) — память процесса.

export const LEVEL_COUNT = 5;

const TABLE = 'ig_game_letter_eater_progress';

export interface ProgressRepository {
  get(childId: string): Promise<number[]>;
  /** Сохраняет лучший результат: звёзды за уровень никогда не уменьшаются. */
  saveBest(childId: string, level: number, stars: number): Promise<number[]>;
}

interface Store {
  load(childId: string): Promise<number[] | null>;
  store(childId: string, stars: number[]): Promise<void>;
}

function memoryStore(): Store {
  const rows = new Map<string, number[]>();
  return {
    load: async (childId) => rows.get(childId) ?? null,
    store: async (childId, stars) => void rows.set(childId, stars),
  };
}

function dbStore(db: GameDb): Store {
  return {
    async load(childId) {
      const { data, error } = await db.from(TABLE).select('stars').eq('child_id', childId).maybeSingle();
      if (error) throw error;
      return data ? (data.stars as number[]) : null;
    },
    async store(childId, stars) {
      const { error } = await db.from(TABLE).upsert({ child_id: childId, stars, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
  };
}

/** Ровно LEVEL_COUNT уровней: если уровней стало больше, новые начинаются с нуля. */
const normalize = (stars: number[] | null) => Array.from({ length: LEVEL_COUNT }, (_, i) => stars?.[i] ?? 0);

export function createProgressRepository(db?: GameDb | null): ProgressRepository {
  const store = db ? dbStore(db) : memoryStore();
  return {
    get: async (childId) => normalize(await store.load(childId)),
    async saveBest(childId, level, stars) {
      const current = normalize(await store.load(childId));
      current[level] = Math.max(current[level], stars);
      await store.store(childId, current);
      return [...current];
    },
  };
}
