import type { GameDb } from '@ig/sdk/server';

// Одно сохранение на ребёнка. С БД — таблица ig_game_moon_valley_saves (migrations/),
// без БД (тесты, запуск без Supabase) — память процесса.

export interface SavedValley {
  childId: string;
  save: unknown;
  updatedAt: string;
}

export interface SavesRepository {
  get(childId: string): Promise<SavedValley | null>;
  save(childId: string, save: unknown): Promise<SavedValley>;
  remove(childId: string): Promise<void>;
}

const TABLE = 'ig_game_moon_valley_saves';

function memoryRepository(): SavesRepository {
  const saves = new Map<string, SavedValley>();
  return {
    get: async (childId) => saves.get(childId) ?? null,
    async save(childId, save) {
      const saved = { childId, save, updatedAt: new Date().toISOString() };
      saves.set(childId, saved);
      return saved;
    },
    remove: async (childId) => void saves.delete(childId),
  };
}

function dbRepository(db: GameDb): SavesRepository {
  return {
    async get(childId) {
      const { data, error } = await db.from(TABLE).select('save, updated_at').eq('child_id', childId).maybeSingle();
      if (error) throw error;
      return data ? { childId, save: data.save, updatedAt: data.updated_at as string } : null;
    },
    async save(childId, save) {
      const updatedAt = new Date().toISOString();
      const { error } = await db.from(TABLE).upsert({ child_id: childId, save, updated_at: updatedAt });
      if (error) throw error;
      return { childId, save, updatedAt };
    },
    async remove(childId) {
      const { error } = await db.from(TABLE).delete().eq('child_id', childId);
      if (error) throw error;
    },
  };
}

export const createSavesRepository = (db?: GameDb | null): SavesRepository => (db ? dbRepository(db) : memoryRepository());
