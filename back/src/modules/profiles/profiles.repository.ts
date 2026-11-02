import { randomUUID } from 'node:crypto';

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  createdAt: string;
}

// In-memory хранилище. Заменить на БД, сохранив сигнатуры.
const profiles = new Map<string, Profile>();

export const profilesRepository = {
  async list() {
    return [...profiles.values()];
  },
  async get(id: string) {
    return profiles.get(id) ?? null;
  },
  async create(data: Pick<Profile, 'name' | 'avatar'>) {
    const profile: Profile = { id: randomUUID(), createdAt: new Date().toISOString(), ...data };
    profiles.set(profile.id, profile);
    return profile;
  },
};
