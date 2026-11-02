import type { GameSdk } from '@ig/sdk';

// Прогресс хранится только на сервере игры, в браузере ничего не сохраняем.
// Без профиля (или без сети) звёзды живут, пока открыта игра.

interface ProgressResponse {
  profileId: string;
  levels: Record<string, number>;
}

export interface ProgressStore {
  stars(levelId: string): number;
  load(): Promise<void>;
  /** Запоминает лучший результат и отправляет его на сервер. */
  record(levelId: string, stars: number): Promise<void>;
}

export function createProgress(sdk: Pick<GameSdk, 'api' | 'profile'>): ProgressStore {
  let levels: Record<string, number> = {};
  const profileId = sdk.profile?.id;

  return {
    stars: (levelId) => levels[levelId] ?? 0,

    async load() {
      if (!profileId) return;
      try {
        const res = await sdk.api.get<ProgressResponse>(`/progress?profileId=${encodeURIComponent(profileId)}`);
        levels = { ...res.levels, ...pickBetter(levels, res.levels) };
      } catch (err) {
        console.warn('space-gardener: не удалось загрузить прогресс', err);
      }
    },

    async record(levelId, stars) {
      if (stars <= (levels[levelId] ?? 0)) return;
      levels = { ...levels, [levelId]: stars };
      if (!profileId) return;
      try {
        const res = await sdk.api.post<ProgressResponse>('/progress', { profileId, levelId, stars });
        levels = { ...res.levels, ...pickBetter(levels, res.levels) };
      } catch (err) {
        console.warn('space-gardener: не удалось сохранить прогресс', err);
      }
    },
  };
}

/** Локальные результаты, которые лучше серверных (пока ответ шёл, ребёнок мог пройти ещё уровень). */
function pickBetter(local: Record<string, number>, remote: Record<string, number>) {
  return Object.fromEntries(Object.entries(local).filter(([id, stars]) => stars > (remote[id] ?? 0)));
}
