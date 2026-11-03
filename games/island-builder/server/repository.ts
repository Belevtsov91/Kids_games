import type { GameDb } from '@ig/sdk/server';
import type { SaveData } from '../src/game/world/index.js';

// Один остров на ребёнка. С БД — таблица ig_game_island_builder_islands (migrations/),
// без БД (тесты, запуск без Supabase) — память процесса.

export interface SavedIsland {
  childId: string;
  island: SaveData;
  updatedAt: string;
}

export interface IslandsRepository {
  get(childId: string): Promise<SavedIsland | null>;
  save(childId: string, island: SaveData): Promise<SavedIsland>;
  remove(childId: string): Promise<void>;
}

const TABLE = 'ig_game_island_builder_islands';

function memoryRepository(): IslandsRepository {
  const islands = new Map<string, SavedIsland>();
  return {
    get: async (childId) => islands.get(childId) ?? null,
    async save(childId, island) {
      const saved = { childId, island, updatedAt: new Date().toISOString() };
      islands.set(childId, saved);
      return saved;
    },
    remove: async (childId) => void islands.delete(childId),
  };
}

function dbRepository(db: GameDb): IslandsRepository {
  return {
    async get(childId) {
      const { data, error } = await db.from(TABLE).select('island, updated_at').eq('child_id', childId).maybeSingle();
      if (error) throw error;
      return data ? { childId, island: data.island as SaveData, updatedAt: data.updated_at as string } : null;
    },
    async save(childId, island) {
      const updatedAt = new Date().toISOString();
      const { error } = await db.from(TABLE).upsert({ child_id: childId, island, updated_at: updatedAt });
      if (error) throw error;
      return { childId, island, updatedAt };
    },
    async remove(childId) {
      const { error } = await db.from(TABLE).delete().eq('child_id', childId);
      if (error) throw error;
    },
  };
}

export const createIslandsRepository = (db?: GameDb | null): IslandsRepository =>
  db ? dbRepository(db) : memoryRepository();
