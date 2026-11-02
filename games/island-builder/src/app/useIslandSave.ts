import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameSdk } from '@ig/sdk';
import { deserialize, emptyStats, emptyWorld, generateIsland, serialize, type Stats, type World } from '../game/world';

// Остров ребёнка: загрузка с сервера игры и автосохранение с задержкой.

const SAVE_DELAY = 1500;

export type SaveStatus = 'loading' | 'saved' | 'saving' | 'offline';

export const SAVE_STATUS_TEXT: Record<SaveStatus, string> = {
  loading: 'Загрузка…',
  saving: 'Сохраняю…',
  saved: 'Сохранено ✓',
  offline: 'Без сохранения',
};

const randomIsland = () => generateIsland(Date.now() % 100000);

export function useIslandSave(sdk: GameSdk) {
  const [world, setWorld] = useState<World>(emptyWorld);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [night, setNight] = useState(false);
  const [achieved, setAchieved] = useState<string[]>([]);
  const [status, setStatus] = useState<SaveStatus>('loading');
  /** Пока остров не загружен, не сохраняем и не проверяем задания. */
  const [ready, setReady] = useState(false);
  /** Остров новый: показываем подсказку «как играть». */
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    let cancelled = false;
    sdk.api
      .get<{ island: unknown }>('/island')
      .then((res) => {
        if (cancelled) return;
        const island = deserialize(res.island);
        if (island) {
          setWorld(island.world);
          setStats(island.stats);
          setNight(island.night);
          setAchieved(island.achieved);
        } else {
          setWorld(randomIsland());
          setIsNew(true);
        }
        setStatus('saved');
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        // Сервер недоступен: играть всё равно можно, просто без сохранения.
        setWorld(randomIsland());
        setIsNew(true);
        setStatus('offline');
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sdk]);

  const snapshot = useMemo(() => serialize({ world, stats, night, achieved }), [world, stats, night, achieved]);
  const pending = useRef<ReturnType<typeof serialize> | null>(null);

  const flush = useCallback(() => {
    const data = pending.current;
    if (!data) return Promise.resolve();
    pending.current = null;
    setStatus('saving');
    return sdk.api
      .post('/island', data)
      .then(() => setStatus((s) => (pending.current ? s : 'saved')))
      .catch(() => setStatus('offline'));
  }, [sdk]);

  useEffect(() => {
    if (!ready) return;
    pending.current = snapshot;
    const timer = setTimeout(() => void flush(), SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [ready, snapshot, flush]);

  // Выход из игры: несохранённое уходит на сервер сразу.
  useEffect(() => () => void flush(), [flush]);

  return {
    world,
    setWorld,
    stats,
    setStats,
    night,
    setNight,
    achieved,
    setAchieved,
    status,
    ready,
    isNew,
    dismissNew: () => setIsNew(false),
  };
}

export type IslandState = ReturnType<typeof useIslandSave>;
