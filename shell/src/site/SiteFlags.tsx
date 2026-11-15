import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchFlags, NO_FLAGS, type SiteFlags } from './flags';

// Флаги сайта для всей оболочки. Спрашиваем при запуске, раз в минуту, а в режиме обслуживания — чаще,
// чтобы сайт открылся сам, как только владелец выключит заглушку. При возвращении на вкладку — сразу.

const NORMAL_MS = 60_000;
const MAINTENANCE_MS = 20_000;

interface SiteFlagsValue extends SiteFlags {
  /** Спросить сервер прямо сейчас (кнопка «Проверить ещё раз»). */
  refresh(): Promise<void>;
}

const Ctx = createContext<SiteFlagsValue>({ ...NO_FLAGS, refresh: async () => {} });

export function SiteFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<SiteFlags>(NO_FLAGS);

  const refresh = useCallback(async () => {
    const next = await fetchFlags();
    if (next) setFlags(next);
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), flags.maintenance ? MAINTENANCE_MS : NORMAL_MS);
    const onVisible = () => document.visibilityState === 'visible' && void refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh, flags.maintenance]);

  return <Ctx.Provider value={{ ...flags, refresh }}>{children}</Ctx.Provider>;
}

export const useSiteFlags = () => useContext(Ctx);

/** Выключил ли владелец игру для всех. */
export function useGameOff(): (id: string) => boolean {
  const { disabledGames } = useSiteFlags();
  return useCallback((id: string) => disabledGames.includes(id), [disabledGames]);
}
