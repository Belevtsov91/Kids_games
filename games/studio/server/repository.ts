import type { GameDb } from '@ig/sdk/server';
import type { Pattern } from '../src/game/pattern.js';
import { memoryRepository } from './memoryRepository.js';
import { MAX_BEATS_PER_PROFILE, type Beat, type BeatsRepository } from './types.js';

// Биты детей. С БД — таблица ig_game_studio_beats (migrations/), без БД — память процесса.

const TABLE = 'ig_game_studio_beats';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNS = 'id, child_id, title, bpm, swing, pattern, shared, created_at';

type Row = { id: string; child_id: string; title: string; bpm: number; swing: number; pattern: Pattern; shared: boolean; created_at: string };
const beatOf = (row: Row): Beat => ({
  id: row.id,
  profileId: row.child_id,
  title: row.title,
  bpm: row.bpm,
  swing: row.swing,
  pattern: row.pattern,
  shared: row.shared,
  createdAt: row.created_at,
});

function dbRepository(db: GameDb): BeatsRepository {
  const select = async (profileId: string, sharedOnly: boolean) => {
    let query = db.from(TABLE).select(COLUMNS).eq('child_id', profileId);
    if (sharedOnly) query = query.eq('shared', true);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(MAX_BEATS_PER_PROFILE);
    if (error) throw error;
    return (data as Row[]).map(beatOf);
  };
  return {
    list: (profileId) => select(profileId, false),
    listShared: (profileId) => select(profileId, true),
    async create({ profileId, title, bpm, swing, pattern }) {
      const { data, error } = await db.from(TABLE).insert({ child_id: profileId, title, bpm, swing, pattern }).select(COLUMNS).single();
      if (error) throw error;
      // Лишние старые биты удаляем: оставляем MAX_BEATS_PER_PROFILE новых.
      const { data: old, error: oldError } = await db
        .from(TABLE)
        .select('id')
        .eq('child_id', profileId)
        .order('created_at', { ascending: false })
        .range(MAX_BEATS_PER_PROFILE, MAX_BEATS_PER_PROFILE + 100);
      if (oldError) throw oldError;
      if (old?.length) {
        const { error: deleteError } = await db.from(TABLE).delete().in('id', old.map((row) => row.id as string));
        if (deleteError) throw deleteError;
      }
      return beatOf(data as Row);
    },
    async share(id, profileId, shared) {
      if (!UUID.test(id)) return null;
      const { data, error } = await db.from(TABLE).update({ shared }).eq('id', id).eq('child_id', profileId).select(COLUMNS);
      if (error) throw error;
      const row = (data as Row[] | null)?.[0];
      return row ? beatOf(row) : null;
    },
    async remove(id, profileId) {
      if (!UUID.test(id)) return false;
      const { data, error } = await db.from(TABLE).delete().eq('id', id).eq('child_id', profileId).select('id');
      if (error) throw error;
      return (data ?? []).length > 0;
    },
  };
}

export const createBeatsRepository = (db?: GameDb | null): BeatsRepository => (db ? dbRepository(db) : memoryRepository());
export { MAX_BEATS_PER_PROFILE, type Beat };
