import { randomUUID } from 'node:crypto';
import type { GameDb } from '@ig/sdk/server';

// Рисунки детей. С БД — таблица ig_game_drawing_drawings (migrations/),
// без БД (тесты, запуск без Supabase) — память процесса.

export interface Drawing {
  id: string;
  profileId: string;
  title: string;
  /** PNG в виде data URL. Позже — ссылка на файл в хранилище. */
  image: string;
  createdAt: string;
}

export type DrawingSummary = Omit<Drawing, 'image'>;

export interface DrawingsRepository {
  /** Без картинок, новые сверху. */
  list(profileId: string): Promise<DrawingSummary[]>;
  /** Отдаёт рисунок, только если он принадлежит этому профилю. */
  get(id: string, profileId: string): Promise<Drawing | null>;
  create(data: Pick<Drawing, 'profileId' | 'title' | 'image'>): Promise<Drawing>;
  /** Удаляет, только если рисунок принадлежит этому профилю. */
  remove(id: string, profileId: string): Promise<boolean>;
}

const TABLE = 'ig_game_drawing_drawings';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function memoryRepository(): DrawingsRepository {
  const drawings = new Map<string, Drawing>();
  return {
    list: async (profileId) =>
      [...drawings.values()]
        .filter((d) => d.profileId === profileId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(({ image: _image, ...summary }) => summary),
    async get(id, profileId) {
      const drawing = drawings.get(id);
      return drawing?.profileId === profileId ? drawing : null;
    },
    async create(data) {
      const drawing: Drawing = { id: randomUUID(), createdAt: new Date().toISOString(), ...data };
      drawings.set(drawing.id, drawing);
      return drawing;
    },
    async remove(id, profileId) {
      if (drawings.get(id)?.profileId !== profileId) return false;
      return drawings.delete(id);
    },
  };
}

type Row = { id: string; child_id: string; title: string; image?: string; created_at: string };
const summaryOf = (row: Row): DrawingSummary => ({
  id: row.id,
  profileId: row.child_id,
  title: row.title,
  createdAt: row.created_at,
});

function dbRepository(db: GameDb): DrawingsRepository {
  return {
    async list(profileId) {
      const { data, error } = await db
        .from(TABLE)
        .select('id, child_id, title, created_at')
        .eq('child_id', profileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Row[]).map(summaryOf);
    },
    async get(id, profileId) {
      // Чужой формат id — просто «не найдено», а не ошибка БД.
      if (!UUID.test(id)) return null;
      const { data, error } = await db
        .from(TABLE)
        .select('id, child_id, title, image, created_at')
        .eq('id', id)
        .eq('child_id', profileId)
        .maybeSingle();
      if (error) throw error;
      return data ? { ...summaryOf(data as Row), image: (data as Row).image! } : null;
    },
    async create({ profileId, title, image }) {
      const { data, error } = await db
        .from(TABLE)
        .insert({ child_id: profileId, title, image })
        .select('id, child_id, title, created_at')
        .single();
      if (error) throw error;
      return { ...summaryOf(data as Row), image };
    },
    async remove(id, profileId) {
      if (!UUID.test(id)) return false;
      const { data, error } = await db.from(TABLE).delete().eq('id', id).eq('child_id', profileId).select('id');
      if (error) throw error;
      return (data ?? []).length > 0;
    },
  };
}

export const createDrawingsRepository = (db?: GameDb | null): DrawingsRepository =>
  db ? dbRepository(db) : memoryRepository();
