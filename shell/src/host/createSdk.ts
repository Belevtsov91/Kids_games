import type { GameManifest, GameSdk, GameStorage } from '@ig/sdk';
import { createApiClient } from '@/api/client';
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

/** SDK для одной запущенной игры. Всё, что игра получает от платформы, проходит здесь. */
export function createSdk(manifest: GameManifest, profile: GameSdk['profile'], exit: () => void): GameSdk {
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
    exit,
  };
}
