import type { GameApi } from '@ig/sdk';
import type { Groove } from '../game/pattern';

// Биты хранятся на сервере игры (/api/games/studio/beats). Чьи они — сервер берёт из сессии.
// «Показать родителям» ставит отметку shared: такие биты взрослый слушает в своём кабинете.

export interface Beat extends Groove {
  id: string;
  profileId: string;
  title: string;
  shared: boolean;
  createdAt: string;
}

export function beatsApi(api: GameApi) {
  return {
    list: () => api.get<Beat[]>('/beats'),
    save: (title: string, groove: Groove) => api.post<Beat>('/beats', { title, ...groove }),
    share: (id: string, shared: boolean) => api.post<Beat>(`/beats/${encodeURIComponent(id)}/share`, { shared }),
    remove: (id: string) => api.delete(`/beats/${encodeURIComponent(id)}`),
  };
}

export type BeatsApi = ReturnType<typeof beatsApi>;
