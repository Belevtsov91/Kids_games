import type { CreationsSdk, GameManifest } from '@ig/sdk';
import { createApiClient } from '@/api/client';
import { settings } from '@/host/settings';
import type { Locale } from '@/i18n/locale';

/** SDK для страницы «Творчество»: запросы только в префикс игры, язык сайта и общий звук. */
export function creationsSdk(game: GameManifest, childId: string, locale: Locale): CreationsSdk {
  return { childId, locale, api: createApiClient(`/games/${game.id}`), muted: settings.muted };
}
