import type { GameApi } from '@ig/sdk';
import { ALBUM_FULL, MAX_IMAGE_CHARS } from '../limits';

// Рисунки ребёнка на сервере игры (таблица ig_game_drawing_drawings). Чьи — сервер знает по сессии.

export interface DrawingSummary {
  id: string;
  title: string;
  createdAt: string;
}

/** Сервер ответил «альбом полон» (409, code: album_full): ребёнку нужно удалить старый рисунок.
 *  Оболочка кладёт тело ответа с ошибкой в err.data. */
export const isAlbumFull = (err: unknown): boolean => {
  const e = err as { status?: number; data?: { code?: unknown } | null } | null;
  return e?.status === 409 && e.data?.code === ALBUM_FULL;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image'));
    img.src = src;
  });

/** Уменьшает PNG, пока data URL не влезет в лимит сервера. Обычный рисунок проходит как есть. */
export async function fitImage(dataUrl: string, maxChars = MAX_IMAGE_CHARS): Promise<string> {
  if (dataUrl.length <= maxChars) return dataUrl;
  const img = await loadImage(dataUrl);
  let result = dataUrl;
  let scale = 1;
  for (let attempt = 0; attempt < 4 && result.length > maxChars; attempt++) {
    // Размер PNG примерно пропорционален площади: уменьшаем стороны по корню, с запасом.
    scale *= Math.sqrt(maxChars / result.length) * 0.9;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
    result = canvas.toDataURL('image/png');
  }
  return result;
}

export const drawingsApi = (api: GameApi) => ({
  list: () => api.get<DrawingSummary[]>('/drawings'),
  image: async (id: string) => (await api.get<{ image: string }>(`/drawings/${encodeURIComponent(id)}`)).image,
  save: async (title: string, image: string) =>
    api.post<{ id: string; createdAt: string }>('/drawings', { title, image: await fitImage(image) }),
  remove: (id: string) => api.delete(`/drawings/${encodeURIComponent(id)}`),
});
export type DrawingsApi = ReturnType<typeof drawingsApi>;
