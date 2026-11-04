import type { GameCloud } from '@ig/sdk';
import { createApiClient } from '@/api/client';

const KEY = /^[a-zA-Z0-9:_-]{1,60}$/;

/** sdk.cloud: сохранения на сервере платформы по ребёнку из сессии. Без сети — null и тихая ошибка. */
export function createCloud(gameId: string): GameCloud {
  const api = createApiClient(`/kid/cloud/${gameId}`);
  return {
    async load<T>(key: string) {
      if (!KEY.test(key)) throw new Error(`cloud: неверный ключ «${key}»`);
      try {
        const res = await api.get<{ value: T | null }>(`/${encodeURIComponent(key)}`);
        return res.value;
      } catch {
        return null;
      }
    },
    async save(key, value) {
      if (!KEY.test(key)) throw new Error(`cloud: неверный ключ «${key}»`);
      await api.put(`/${encodeURIComponent(key)}`, { value });
    },
  };
}
