import type { GameSdk } from '@ig/sdk';
import { LEVELS, type Level } from './clock';

// Сколько дней Тёпа прожил по часам и какой уровень открыт. Хранится в облаке платформы
// (по ребёнку) и копией в браузере: без сети игра работает, на другом устройстве счёт продолжится.

export interface Save {
  days: number;
  unlocked: Level;
}

const KEY = 'progress';
const empty = (): Save => ({ days: 0, unlocked: 0 });

export function valid(v: unknown): v is Save {
  const s = v as Save;
  return typeof s?.days === 'number' && s.days >= 0 && LEVELS.includes(s.unlocked);
}

/** Из двух копий берём ту, где больше дней; открытый уровень — наибольший из двух. */
export function merge(...saves: unknown[]): Save {
  const ok = saves.filter(valid);
  if (!ok.length) return empty();
  return {
    days: Math.max(...ok.map((s) => s.days)),
    unlocked: Math.max(...ok.map((s) => s.unlocked)) as Level,
  };
}

type Sdk = Pick<GameSdk, 'storage' | 'cloud' | 'profile'>;

export async function loadSave(sdk: Sdk): Promise<Save> {
  const local = sdk.storage.load<Save>(KEY);
  const cloud = sdk.profile ? await sdk.cloud.load<Save>(KEY).catch(() => null) : null;
  return merge(local, cloud);
}

export async function storeSave(sdk: Sdk, save: Save) {
  sdk.storage.save(KEY, save);
  if (sdk.profile) await sdk.cloud.save(KEY, save).catch(() => undefined);
}
