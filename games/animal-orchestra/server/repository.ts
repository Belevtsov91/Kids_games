import { randomUUID } from 'node:crypto';
import type { GameDb } from '@ig/sdk/server';
import type { SongNote } from '../src/game/song.js';

// Мелодии детей. С БД — таблица ig_game_animal_orchestra_melodies (migrations/),
// без БД (тесты, запуск без Supabase) — память процесса.

export interface Melody {
  id: string;
  profileId: string;
  title: string;
  notes: SongNote[];
  createdAt: string;
}

/** Сколько мелодий хранится у одного ребёнка; старые уходят, когда приходят новые. */
export const MAX_MELODIES_PER_PROFILE = 30;

export interface MelodiesRepository {
  /** Новые сверху. */
  list(profileId: string): Promise<Melody[]>;
  create(data: Pick<Melody, 'profileId' | 'title' | 'notes'>): Promise<Melody>;
  /** Удаляет, только если мелодия принадлежит этому профилю. */
  remove(id: string, profileId: string): Promise<boolean>;
}

const TABLE = 'ig_game_animal_orchestra_melodies';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function memoryRepository(): MelodiesRepository {
  const melodies = new Map<string, Melody>();
  const list = async (profileId: string) =>
    [...melodies.values()]
      .filter((m) => m.profileId === profileId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    list,
    async create(data) {
      const melody: Melody = { id: randomUUID(), createdAt: new Date().toISOString(), ...data };
      melodies.set(melody.id, melody);
      for (const old of (await list(data.profileId)).slice(MAX_MELODIES_PER_PROFILE)) melodies.delete(old.id);
      return melody;
    },
    async remove(id, profileId) {
      if (melodies.get(id)?.profileId !== profileId) return false;
      return melodies.delete(id);
    },
  };
}

type Row = { id: string; child_id: string; title: string; notes: SongNote[]; created_at: string };
const melodyOf = (row: Row): Melody => ({
  id: row.id,
  profileId: row.child_id,
  title: row.title,
  notes: row.notes,
  createdAt: row.created_at,
});
const COLUMNS = 'id, child_id, title, notes, created_at';

function dbRepository(db: GameDb): MelodiesRepository {
  return {
    async list(profileId) {
      const { data, error } = await db
        .from(TABLE)
        .select(COLUMNS)
        .eq('child_id', profileId)
        .order('created_at', { ascending: false })
        .limit(MAX_MELODIES_PER_PROFILE);
      if (error) throw error;
      return (data as Row[]).map(melodyOf);
    },
    async create({ profileId, title, notes }) {
      const { data, error } = await db.from(TABLE).insert({ child_id: profileId, title, notes }).select(COLUMNS).single();
      if (error) throw error;
      // Лишние старые мелодии удаляем: оставляем MAX_MELODIES_PER_PROFILE новых.
      const { data: old, error: oldError } = await db
        .from(TABLE)
        .select('id')
        .eq('child_id', profileId)
        .order('created_at', { ascending: false })
        .range(MAX_MELODIES_PER_PROFILE, MAX_MELODIES_PER_PROFILE + 100);
      if (oldError) throw oldError;
      if (old?.length) {
        const { error: deleteError } = await db.from(TABLE).delete().in('id', old.map((row) => row.id as string));
        if (deleteError) throw deleteError;
      }
      return melodyOf(data as Row);
    },
    async remove(id, profileId) {
      if (!UUID.test(id)) return false;
      const { data, error } = await db.from(TABLE).delete().eq('id', id).eq('child_id', profileId).select('id');
      if (error) throw error;
      return (data ?? []).length > 0;
    },
  };
}

export const createMelodiesRepository = (db?: GameDb | null): MelodiesRepository =>
  db ? dbRepository(db) : memoryRepository();
