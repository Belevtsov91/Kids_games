import type { GameStorage } from '@ig/sdk';
import { createCloud } from './cloud';

// sdk.storage игры: localStorage на этом устройстве + копия в облаке платформы по ребёнку.
// Игре ничего менять не нужно: перед запуском оболочка подтягивает облачную копию (hydrateStorage),
// а каждое сохранение через пару секунд уходит в облако. Так прогресс 2D-игр без своего сервера
// не теряется на другом устройстве и после очистки браузера. Ключи — свои у каждого ребёнка.

const CLOUD_KEY = '__storage';
const STAMP = '__t';
/** Одно значение больше этого в облако не уходит (например, своя картинка в пазлах), остальные — уходят. */
const MAX_VALUE_CHARS = 16_000;
const MAX_SNAPSHOT_CHARS = 60_000;
const PUSH_DELAY_MS = 1500;

interface Snapshot {
  t: number;
  data: Record<string, unknown>;
}

const prefixOf = (gameId: string, childId: string | null) => (childId ? `ig:game:${gameId}:${childId}:` : `ig:game:${gameId}:`);
/** Ключи до разделения по детям: читаем их, пока у ребёнка нет своих. */
const legacyPrefix = (gameId: string) => `ig:game:${gameId}:`;

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function readSnapshot(prefix: string): Snapshot {
  const data: Record<string, unknown> = {};
  let size = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const full = localStorage.key(i);
    if (!full?.startsWith(prefix)) continue;
    const key = full.slice(prefix.length);
    const raw = localStorage.getItem(full);
    if (key === STAMP || raw === null || raw.length > MAX_VALUE_CHARS || size + raw.length > MAX_SNAPSHOT_CHARS) continue;
    size += raw.length;
    data[key] = safe(() => JSON.parse(raw) as unknown, null);
  }
  return { t: Number(localStorage.getItem(prefix + STAMP) ?? 0), data };
}

/** Перед запуском игры: если в облаке копия новее, чем на устройстве, — берём её. Не дольше 2 секунд. */
export async function hydrateStorage(gameId: string, childId: string | null) {
  if (!childId || typeof localStorage === 'undefined') return;
  const prefix = prefixOf(gameId, childId);
  const cloud = createCloud(gameId);
  const remote = await Promise.race([
    cloud.load<Snapshot>(CLOUD_KEY).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
  ]);
  if (!remote || typeof remote.t !== 'number' || !remote.data) return;
  const localT = safe(() => Number(localStorage.getItem(prefix + STAMP) ?? 0), 0);
  if (remote.t <= localT) return;
  safe(() => {
    for (const [key, value] of Object.entries(remote.data)) localStorage.setItem(prefix + key, JSON.stringify(value));
    localStorage.setItem(prefix + STAMP, String(remote.t));
  }, undefined);
}

export function createSyncedStorage(gameId: string, childId: string | null): GameStorage {
  const prefix = prefixOf(gameId, childId);
  const legacy = legacyPrefix(gameId);
  const cloud = childId ? createCloud(gameId) : null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const push = () => {
    timer = null;
    if (!cloud) return;
    const snapshot = safe(() => readSnapshot(prefix), null);
    if (snapshot) void cloud.save(CLOUD_KEY, snapshot).catch(() => undefined);
  };

  return {
    load<T>(key: string) {
      const raw = safe(() => localStorage.getItem(prefix + key) ?? (childId ? localStorage.getItem(legacy + key) : null), null);
      if (raw === null) return null;
      return safe(() => JSON.parse(raw) as T, null);
    },
    save(key, value) {
      safe(() => {
        localStorage.setItem(prefix + key, JSON.stringify(value));
        localStorage.setItem(prefix + STAMP, String(Date.now()));
      }, undefined);
      if (cloud) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(push, PUSH_DELAY_MS);
      }
    },
  };
}
