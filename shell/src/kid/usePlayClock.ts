import { useEffect, useRef, useState } from 'react';
import { kidApi, tz, useKidStatus, type KidStatus } from './KidStatus';
import { applyOffline, offlineSeconds } from './offlineTime';

const BEAT_MS = 60_000;

/**
 * Пока игра открыта и вкладка видна: «пульс» серверу раз в минуту (он считает время),
 * и счёт минут подряд для напоминания о перерыве. Возвращает, пора ли показать перерыв.
 */
export function usePlayClock(gameId: string | undefined, running: boolean) {
  const { status, set } = useKidStatus();
  const breakEvery = status?.breakEvery ?? 0;
  const [pause, setPause] = useState(false);
  const streak = useRef(0);
  // Последний ответ сервера: от него считаем время, если сеть пропала.
  const serverStatus = useRef<KidStatus | null>(null);
  if (status && !serverStatus.current) serverStatus.current = status;

  useEffect(() => {
    if (!gameId || !running) return;
    let lastTry = Date.now();
    const beat = async () => {
      if (document.hidden) return;
      const now = Date.now();
      const gap = Math.min(60, Math.max(0, Math.round((now - lastTry) / 1000)));
      lastTry = now;
      const offline = offlineSeconds.get();
      try {
        const next = await kidApi.post<KidStatus>('/beat', { gameId, tz: tz(), ...(offline ? { offline } : {}) });
        offlineSeconds.clear();
        serverStatus.current = next;
        set(next);
      } catch {
        // Нет сети: время считаем сами, иначе режим полёта снимал бы лимит и тихие часы.
        offlineSeconds.add(gap);
        if (serverStatus.current) set(applyOffline(serverStatus.current, offlineSeconds.get()));
      }
    };
    void beat();
    const id = setInterval(() => {
      void beat();
      if (document.hidden) return;
      streak.current += 1;
      if (breakEvery > 0 && streak.current >= breakEvery) {
        streak.current = 0;
        setPause(true);
      }
    }, BEAT_MS);
    const onVisible = () => !document.hidden && void beat();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [gameId, running, breakEvery, set]);

  return { pause, endPause: () => setPause(false) };
}
