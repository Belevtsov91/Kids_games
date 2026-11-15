import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

// Загрузка данных страницы с автообновлением раз в 30 секунд (пока вкладка видна).

export const REFRESH_MS = 30_000;

export interface Loaded<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
}

export function useLoad<T>(load: () => Promise<T>, deps: unknown[], refresh = true): Loaded<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  loadRef.current = load;
  const turn = useRef(0);

  const reload = useCallback(async () => {
    const mine = ++turn.current;
    try {
      const next = await loadRef.current();
      if (mine !== turn.current) return;
      setData(next);
      setError(null);
    } catch (err) {
      if (mine !== turn.current) return;
      // Сессия кончилась — покажется вход, ошибку на странице не рисуем.
      if (!(err instanceof ApiError && err.code === 'auth')) setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (mine === turn.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void reload();
    if (!refresh) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void reload();
    }, REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload };
}
