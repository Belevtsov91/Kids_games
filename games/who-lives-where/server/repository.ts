import type { GameDb } from '@ig/sdk/server';
import { emptyProgress, mergeProgress, type Progress } from '../src/game/rounds.js';

// Прогресс по ребёнку. С БД — таблица ig_game_who_lives_where_progress (migrations/),
// без БД (тесты, запуск без Supabase) — память процесса.

const TABLE = 'ig_game_who_lives_where_progress';

export interface ProgressRepository {
  get(childId: string): Promise<Progress>;
  save(childId: string, update: Partial<Progress>): Promise<Progress>;
}

interface Store {
  load(childId: string): Promise<Progress | null>;
  store(childId: string, progress: Progress): Promise<void>;
}

function memoryStore(): Store {
  const rows = new Map<string, Progress>();
  return {
    load: async (childId) => rows.get(childId) ?? null,
    store: async (childId, progress) => void rows.set(childId, progress),
  };
}

function dbStore(db: GameDb): Store {
  return {
    async load(childId) {
      const { data, error } = await db.from(TABLE).select('level, found').eq('child_id', childId).maybeSingle();
      if (error) throw error;
      return data ? { level: data.level, found: data.found } : null;
    },
    async store(childId, { level, found }) {
      const { error } = await db
        .from(TABLE)
        .upsert({ child_id: childId, level, found, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
  };
}

export function createProgressRepository(db?: GameDb | null): ProgressRepository {
  const store = db ? dbStore(db) : memoryStore();
  return {
    get: async (childId) => (await store.load(childId)) ?? emptyProgress(),
    async save(childId, update) {
      const next = mergeProgress((await store.load(childId)) ?? emptyProgress(), update);
      await store.store(childId, next);
      return next;
    },
  };
}
