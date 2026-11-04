import { ApiError, createApiClient } from '@/api/client';
import type { KidRules, KidStats, KidTime } from '@/kid/KidStatus';

// Запросы кабинета (/api/parent). Каждый удачный запрос продлевает открытый кабинет на сервере,
// ответ 423 значит «кабинет закрыт» — оболочка кабинета тогда показывает задачу.

export interface ChildCard {
  id: string;
  name: string;
  age: number;
  avatar: string;
  lang: string | null;
  photo: string | null;
  rules: KidRules;
  time: KidTime;
  week: { day: string; minutes: number }[];
  lastGame: string | null;
  playingNow: boolean;
  toddler: boolean | null;
  birthMonth: string | null;
  comfort: { musicVolume: number; effectsVolume: number; reduceMotion: boolean; bigButtons: boolean };
  /** План дня: до трёх id игр. */
  plan: string[];
}

export interface SkillsReport {
  skills: { skill: string; total: number; right: number; recent: number; games: string[]; level: 'good' | 'learning' | 'new' }[];
  levels: Record<string, number>;
  stickers: { gameId: string; sticker: string; earnedAt: string }[];
}

export interface ChildDetail extends ChildCard {
  access: Record<string, boolean>;
}

export interface Overview {
  children: ChildCard[];
  requests: { id: string; child_id: string; minutes: number; created_at: string }[];
}

export interface Account {
  name: string;
  email: string;
  photo: string | null;
  timezone: string | null;
  hasPin: boolean;
}

export type { KidStats as ChildStats };

type Listener = (event: 'activity' | 'locked') => void;
const listeners = new Set<Listener>();
export const onParentEvent = (l: Listener) => (listeners.add(l), () => void listeners.delete(l));
const emit = (e: 'activity' | 'locked') => listeners.forEach((l) => l(e));

const raw = createApiClient('/parent');

async function call<T>(run: () => Promise<T>): Promise<T> {
  try {
    const result = await run();
    emit('activity');
    return result;
  } catch (err) {
    if (err instanceof ApiError && err.status === 423) emit('locked');
    throw err;
  }
}

/** Клиент кабинета: те же get/post/put/patch/delete, плюс продление и закрытие по 423. */
export const papi = {
  raw,
  get: <T>(path: string) => call(() => raw.get<T>(path)),
  post: <T>(path: string, body: unknown) => call(() => raw.post<T>(path, body)),
  put: <T>(path: string, body: unknown) => call(() => raw.put<T>(path, body)),
  patch: <T>(path: string, body: unknown) => call(() => raw.patch<T>(path, body)),
  delete: (path: string) => call(() => raw.delete(path)),
};

export const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Код ошибки из ответа сервера ({ code }) — для понятного текста. */
export function errorCode(err: unknown): string | null {
  if (!(err instanceof ApiError)) return 'offline';
  return typeof err.data?.code === 'string' ? err.data.code : `http${err.status}`;
}
