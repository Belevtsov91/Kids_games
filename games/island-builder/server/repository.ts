import type { SaveData } from '../src/world.js';

export interface SavedIsland {
  childId: string;
  island: SaveData;
  updatedAt: string;
}

// In-memory хранилище: один остров на ребёнка. Заменить на БД, сохранив сигнатуры.
const islands = new Map<string, SavedIsland>();

export const islandsRepository = {
  async get(childId: string): Promise<SavedIsland | null> {
    return islands.get(childId) ?? null;
  },
  async save(childId: string, island: SaveData): Promise<SavedIsland> {
    const saved = { childId, island, updatedAt: new Date().toISOString() };
    islands.set(childId, saved);
    return saved;
  },
  async remove(childId: string): Promise<boolean> {
    return islands.delete(childId);
  },
};
