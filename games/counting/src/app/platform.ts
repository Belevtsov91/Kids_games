import type { GameSdk, Skill } from '@ig/sdk';
import { modes, type Mode } from '../game/logic';
import { ROUNDS } from '../game/themes';
import type { Progress } from './savedState';

// Связь с платформой: навыки и наклейки (sdk.progress) и звёзды в облаке (sdk.cloud),
// чтобы на другом устройстве ребёнок видел те же звёзды.

const SKILL_OF: Record<Mode, Skill> = {
  count: 'count',
  feed: 'count',
  digit: 'numbers',
  sequence: 'numbers',
  compare: 'logic',
  calculate: 'count',
};

const CLOUD_KEY = 'stars';

export function reportAnswer(sdk: GameSdk, mode: Mode, right: boolean) {
  sdk.progress.skill(SKILL_OF[mode], right);
}

/** Конец серии из ROUNDS заданий: уровень и наклейки. progress уже включает эту серию. */
export function reportFinish(sdk: GameSdk, mode: Mode, stars: number, progress: Progress, limit: number) {
  sdk.progress.level(`${mode}-${limit}`);
  sdk.progress.sticker('first-game');
  if (stars === ROUNDS) sdk.progress.sticker('all-stars');
  if (limit >= 20) sdk.progress.sticker('big-numbers');
  const played = new Set(Object.keys(progress).map((key) => key.split(':')[0]));
  if (modes.every((m) => played.has(m))) sdk.progress.sticker('all-modes');
}

/** Звёзды из облака, слитые с местными (берём лучшее). null — облака нет или там пусто. */
export async function pullCloud(sdk: GameSdk, local: Progress): Promise<Progress | null> {
  if (!sdk.profile) return null;
  const cloud = await sdk.cloud.load<Progress>(CLOUD_KEY).catch(() => null);
  if (!cloud || typeof cloud !== 'object') return null;
  const merged: Progress = { ...local };
  for (const [key, value] of Object.entries(cloud)) {
    if (typeof value === 'number' && value >= 0 && value <= ROUNDS) merged[key] = Math.max(merged[key] ?? 0, value);
  }
  return merged;
}

export function pushCloud(sdk: GameSdk, progress: Progress) {
  if (sdk.profile) void sdk.cloud.save(CLOUD_KEY, progress).catch(() => undefined);
}
