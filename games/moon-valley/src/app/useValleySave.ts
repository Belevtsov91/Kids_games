// Прогресс ребёнка: сервер игры (Supabase, по ребёнку из сессии) и запасная копия в локальном хранилище.
// Без входа или без сервера игра работает на локальной копии.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameSdk } from '@ig/sdk';
import { restoreState, type ValleyState } from '../game/valley';

const SAVE_DELAY = 1500;

export type SaveStatus = 'loading' | 'saved' | 'saving' | 'local';

export const SAVE_STATUS_TEXT: Record<SaveStatus, string> = {
  loading: 'Загрузка…',
  saving: 'Сохраняю…',
  saved: 'Сохранено ✓',
  local: 'Сохранено на этом устройстве',
};

const stamp = (value: unknown) =>
  value && typeof value === 'object' && typeof (value as { savedAt?: unknown }).savedAt === 'number' ? (value as { savedAt: number }).savedAt : 0;

export function useValleySave(sdk: GameSdk) {
  // Локальная копия у каждого ребёнка своя; старое общее «save» достаётся тому, кто первым откроет игру.
  const localKey = `save:${sdk.profile?.id ?? 'guest'}`;
  const readLocal = useCallback((): unknown => {
    try {
      const own = sdk.storage.load<unknown>(localKey);
      if (own) return own;
      const legacy = sdk.storage.load<unknown>('save');
      if (legacy && sdk.profile) sdk.storage.save('save', null);
      return legacy;
    } catch {
      return null;
    }
  }, [sdk, localKey]);

  const [state, setState] = useState<ValleyState>(() => restoreState(readLocal()));
  const [status, setStatus] = useState<SaveStatus>('loading');
  const [ready, setReady] = useState(false);
  const online = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const local = readLocal();
    sdk.api
      .get<{ save: unknown }>('/save')
      .then((res) => {
        if (cancelled) return;
        online.current = true;
        // Берём более свежую копию: сервер или это устройство.
        if (res.save && stamp(res.save) >= stamp(local)) setState(restoreState(res.save));
        setStatus('saved');
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('local');
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sdk, readLocal]);

  const pending = useRef<(ValleyState & { savedAt: number }) | null>(null);
  const flush = useCallback(() => {
    const data = pending.current;
    if (!data || !online.current) return Promise.resolve();
    pending.current = null;
    setStatus('saving');
    return sdk.api
      .post('/save', data)
      .then(() => setStatus((current) => (pending.current ? current : 'saved')))
      .catch(() => {
        online.current = false;
        setStatus('local');
      });
  }, [sdk]);

  useEffect(() => {
    if (!ready) return;
    const data = { ...state, savedAt: Date.now() };
    try {
      sdk.storage.save(localKey, data);
    } catch {
      /* хранилище переполнено или недоступно — играть всё равно можно */
    }
    pending.current = data;
    const timer = setTimeout(() => void flush(), SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [ready, state, sdk, localKey, flush]);

  // Выход из игры: несохранённое уходит на сервер сразу.
  useEffect(() => () => void flush(), [flush]);

  return { state, setState, status, ready };
}
