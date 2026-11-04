import type { GameSdk } from '@ig/sdk';
import type { DrawingsApi } from './drawings';

// Награды платформы за сохранённый рисунок: навыки и наклейки (видны в альбоме ребёнка и в кабинете).
export async function rewardSaved(sdk: GameSdk, api: DrawingsApi, kind: 'drawing' | 'coloring') {
  sdk.progress.skill('creativity', true);
  sdk.progress.skill(kind === 'coloring' ? 'colors' : 'motor', true);
  sdk.progress.sticker(kind === 'coloring' ? 'first-coloring' : 'first-drawing');
  const saved = await api.list().catch(() => []);
  if (saved.length >= 10) sdk.progress.sticker('ten-drawings');
}
