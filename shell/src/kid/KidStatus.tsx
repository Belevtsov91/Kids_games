import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createApiClient } from '@/api/client';

// Время ребёнка: сколько осталось, тихие часы, просьба о времени, какие игры закрыл взрослый.
// Считает и решает сервер; здесь только последний ответ и опрос раз в минуту.

export interface KidTime {
  day: string;
  limit: number | null;
  usedMinutes: number;
  remaining: number | null;
  blocked: 'quiet' | 'limit' | null;
  quietTo: string | null;
}

export interface KidRules {
  limitWeekday: number | null;
  limitWeekend: number | null;
  quietFrom: string | null;
  quietTo: string | null;
  breakEvery: number;
  canAsk: boolean;
}

export interface KidStatus {
  time: KidTime;
  rules: KidRules;
  breakEvery: number;
  canAsk: boolean;
  access: Record<string, boolean>;
  request: { id: string; minutes: number; status: 'pending' | 'approved' | 'denied' } | null;
}

export interface KidStats {
  days: { day: string; minutes: number }[];
  games: { gameId: string; minutes: number; lastDay: string }[];
}

export const kidApi = createApiClient('/kid');
export const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
export const ASK_MINUTES = [5, 10, 15, 30];

interface Value {
  status: KidStatus | null;
  set(status: KidStatus): void;
  refresh(): Promise<void>;
  ask(minutes: number): Promise<void>;
}

const Ctx = createContext<Value | null>(null);
const POLL_MS = 60_000;

/** Даёт всем страницам ребёнка его время. Пока ждём ответа взрослого, спрашиваем чаще. */
export function KidStatusProvider({ children }: { children: ReactNode }) {
  const [status, set] = useState<KidStatus | null>(null);

  const refresh = useCallback(async () => {
    try {
      set(await kidApi.get<KidStatus>(`/status?tz=${encodeURIComponent(tz())}`));
    } catch {
      // сервер недоступен или БД не настроена: играем без таймера
    }
  }, []);

  const pending = status?.request?.status === 'pending';
  useEffect(() => {
    void refresh();
    const id = setInterval(() => !document.hidden && void refresh(), pending ? 15_000 : POLL_MS);
    return () => clearInterval(id);
  }, [refresh, pending]);

  const value = useMemo<Value>(
    () => ({
      status,
      set,
      refresh,
      async ask(minutes) {
        await kidApi.post('/requests', { minutes, tz: tz() });
        await refresh();
      },
    }),
    [status, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useKidStatus() {
  const value = useContext(Ctx);
  if (!value) throw new Error('useKidStatus вне KidStatusProvider');
  return value;
}

/** Можно ли ребёнку эту игру: решение взрослого, иначе возраст. */
export function gameAllowed(access: Record<string, boolean> | undefined, gameId: string, fitsAge: boolean) {
  return access?.[gameId] ?? fitsAge;
}
