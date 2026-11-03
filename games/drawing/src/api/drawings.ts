import type { GameApi } from '@ig/sdk';

// Рисунки ребёнка на сервере игры (таблица ig_game_drawing_drawings). Чьи — сервер знает по сессии.

export interface DrawingSummary {
  id: string;
  title: string;
  createdAt: string;
}

export const drawingsApi = (api: GameApi) => ({
  list: () => api.get<DrawingSummary[]>('/drawings'),
  image: async (id: string) => (await api.get<{ image: string }>(`/drawings/${encodeURIComponent(id)}`)).image,
  save: (title: string, image: string) => api.post<{ id: string; createdAt: string }>('/drawings', { title, image }),
  remove: (id: string) => api.delete(`/drawings/${encodeURIComponent(id)}`),
});
export type DrawingsApi = ReturnType<typeof drawingsApi>;

export const defaultTitle = (date = new Date()) =>
  `Рисунок ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
