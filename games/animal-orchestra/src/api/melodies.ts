import type { GameApi } from '@ig/sdk';
import type { SongNote } from '../game/song';

// Мелодии хранятся только на сервере игры (/api/games/animal-orchestra/melodies), в браузере — ничего.
// Чьи они, сервер берёт из сессии: id ребёнка клиент не передаёт.

export interface Melody {
  id: string;
  profileId: string;
  title: string;
  notes: SongNote[];
  createdAt: string;
}

export function melodiesApi(api: GameApi) {
  return {
    list: () => api.get<Melody[]>('/melodies'),
    save: (notes: SongNote[], title: string) => api.post<Melody>('/melodies', { title, notes }),
    remove: (id: string) => api.delete(`/melodies/${encodeURIComponent(id)}`),
  };
}

export type MelodiesApi = ReturnType<typeof melodiesApi>;
