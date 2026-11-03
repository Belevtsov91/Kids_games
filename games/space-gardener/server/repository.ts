import type { GameDb } from '@ig/sdk/server';

// Прогресс садовника: лучшие звёзды за уровни по ребёнку.
// С БД — таблица ig_game_space_gardener_levels (migrations/), строка на уровень;
// без БД (тесты, запуск без Supabase) — память процесса.

export interface Progress {
  profileId: string;
  /** id уровня → лучшие звёзды (1..3). */
  levels: Record<string, number>;
}

export interface ProgressRepository {
  get(profileId: string): Promise<Progress>;
  /** Сохраняет результат, только если он лучше прежнего. */
  record(profileId: string, levelId: string, stars: number): Promise<Progress>;
}

const TABLE = 'ig_game_space_gardener_levels';

interface Store {
  load(childId: string): Promise<Record<string, number>>;
  storeLevel(childId: string, levelId: string, stars: number): Promise<void>;
}

function memoryStore(): Store {
  const rows = new Map<string, Record<string, number>>();
  return {
    load: async (childId) => ({ ...(rows.get(childId) ?? {}) }),
    async storeLevel(childId, levelId, stars) {
      rows.set(childId, { ...(rows.get(childId) ?? {}), [levelId]: stars });
    },
  };
}

function dbStore(db: GameDb): Store {
  return {
    async load(childId) {
      const { data, error } = await db.from(TABLE).select('level_id, stars').eq('child_id', childId);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((row) => [row.level_id as string, row.stars as number]));
    },
    async storeLevel(childId, levelId, stars) {
      const { error } = await db
        .from(TABLE)
        .upsert({ child_id: childId, level_id: levelId, stars, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
  };
}

export function createProgressRepository(db?: GameDb | null): ProgressRepository {
  const store = db ? dbStore(db) : memoryStore();
  return {
    get: async (profileId) => ({ profileId, levels: await store.load(profileId) }),
    async record(profileId, levelId, stars) {
      const levels = await store.load(profileId);
      if (stars > (levels[levelId] ?? 0)) {
        await store.storeLevel(profileId, levelId, stars);
        levels[levelId] = stars;
      }
      return { profileId, levels };
    },
  };
}
