import { useEffect, useRef, useState } from 'react';
import { kidApi, tz, useKidStatus, type KidStatus } from './KidStatus';

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

  useEffect(() => {
    if (!gameId || !running) return;
    const beat = async () => {
      if (document.hidden) return;
      try {
        set(await kidApi.post<KidStatus>('/beat', { gameId, tz: tz() }));
      } catch {
        // без сервера играем без счёта времени
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
