import { randomUUID } from 'node:crypto';
import { MAX_BEATS_PER_PROFILE, type Beat, type BeatsRepository } from './types.js';

// Без БД (тесты, запуск без Supabase) биты живут в памяти процесса.
export function memoryRepository(): BeatsRepository {
  const beats = new Map<string, Beat>();
  let tick = 0;
  const list = async (profileId: string) =>
    [...beats.values()].filter((b) => b.profileId === profileId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    list,
    async listShared(profileId) {
      return (await list(profileId)).filter((b) => b.shared);
    },
    async create(data) {
      // Добавка к времени держит порядок, даже если два бита сохранены в одну миллисекунду.
      const createdAt = new Date(Date.now() + tick++).toISOString();
      const beat: Beat = { id: randomUUID(), createdAt, shared: false, ...data };
      beats.set(beat.id, beat);
      for (const old of (await list(data.profileId)).slice(MAX_BEATS_PER_PROFILE)) beats.delete(old.id);
      return beat;
    },
    async share(id, profileId, shared) {
      const beat = beats.get(id);
      if (beat?.profileId !== profileId) return null;
      beat.shared = shared;
      return beat;
    },
    async remove(id, profileId) {
      if (beats.get(id)?.profileId !== profileId) return false;
      return beats.delete(id);
    },
  };
}
