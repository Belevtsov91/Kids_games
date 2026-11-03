import type { GameComfort, GameManifest, GameSdk, GameStorage } from '@ig/sdk';
import { createApiClient } from '@/api/client';
import type { Child } from '@/auth/AuthContext';
import { isToddler } from '@/kid/toddler';
import { timeBus } from '@/kid/timeBus';
import { createCloud } from './cloud';
import { createProgressQueue, type ProgressQueue } from './progressQueue';
import { localeStore } from '@/i18n/locale';
import { settings } from './settings';

function createStorage(gameId: string): GameStorage {
  const prefix = `ig:game:${gameId}:`;
  return {
    load<T>(key: string) {
      const raw = localStorage.getItem(prefix + key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    save(key, value) {
      localStorage.setItem(prefix + key, JSON.stringify(value));
    },
  };
}

/** Удобство из настроек ребёнка; системное «уменьшить движение» тоже считается. */
export function comfortOf(child: Child | null | undefined): GameComfort {
  const c = child?.comfort;
  const systemCalm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    musicVolume: (c?.musicVolume ?? 80) / 100,
    effectsVolume: (c?.effectsVolume ?? 100) / 100,
    reduceMotion: Boolean(c?.reduceMotion) || systemCalm,
    bigButtons: Boolean(c?.bigButtons),
    toddler: isToddler(child),
  };
}

export interface SdkExtras {
  child?: Child | null;
  /** Игра выдала наклейку: оболочка покажет её вылет. */
  onSticker?: (id: string) => void;
}

/** SDK для одной запущенной игры. Всё, что игра получает от платформы, проходит здесь. */
export function createSdk(
  manifest: GameManifest,
  profile: GameSdk['profile'],
  exit: () => void,
  extras: SdkExtras = {},
): GameSdk & { progress: ProgressQueue } {
  timeBus.reset();
  return {
    manifest,
    profile,
    api: createApiClient(`/games/${manifest.id}`),
    storage: createStorage(manifest.id),
    locale: localeStore.get(),
    audio: {
      get muted() {
        return settings.muted;
      },
      onMuteChange: settings.onMuteChange,
    },
    progress: createProgressQueue(manifest, Boolean(profile), extras.onSticker),
    time: {
      get remaining() {
        return timeBus.remaining;
      },
      onEnding: timeBus.onEnding,
    },
    cloud: createCloud(manifest.id),
    comfort: comfortOf(extras.child),
    exit,
  };
}
