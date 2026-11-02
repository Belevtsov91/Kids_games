import { randomUUID } from 'node:crypto';
import type { SongNote } from '../src/game/song.js';

export interface Melody {
  id: string;
  profileId: string;
  title: string;
  notes: SongNote[];
  createdAt: string;
}

/** Сколько мелодий хранится у одного ребёнка; старые уходят, когда приходят новые. */
export const MAX_MELODIES_PER_PROFILE = 30;

// In-memory хранилище. Заменить на БД, сохранив сигнатуры.
const melodies = new Map<string, Melody>();

export const melodiesRepository = {
  /** Новые сверху. */
  async list(profileId: string): Promise<Melody[]> {
    return [...melodies.values()]
      .filter((m) => m.profileId === profileId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async create(data: Pick<Melody, 'profileId' | 'title' | 'notes'>) {
    const melody: Melody = { id: randomUUID(), createdAt: new Date().toISOString(), ...data };
    melodies.set(melody.id, melody);
    const own = await this.list(data.profileId);
    for (const old of own.slice(MAX_MELODIES_PER_PROFILE)) melodies.delete(old.id);
    return melody;
  },
  /** Удаляет, только если мелодия принадлежит этому профилю. */
  async remove(id: string, profileId: string) {
    const melody = melodies.get(id);
    if (!melody || melody.profileId !== profileId) return false;
    return melodies.delete(id);
  },
};
