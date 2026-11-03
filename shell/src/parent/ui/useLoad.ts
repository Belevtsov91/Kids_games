import { useCallback, useEffect, useState } from 'react';

/** Загрузка данных страницы кабинета с перезагрузкой после изменений. error — текст ошибки или null. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const run = useCallback(load, deps);
  const reload = useCallback(async () => {
    try {
      setData(await run());
      setError(false);
    } catch {
      setError(true);
    }
  }, [run]);
  useEffect(() => void reload(), [reload]);
  return { data, error, reload, setData };
}
