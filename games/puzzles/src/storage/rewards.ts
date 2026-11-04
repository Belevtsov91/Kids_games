// Связь с платформой: навык «пространство» за каждую деталь, уровень и наклейки за собранный пазл.
// Сколько пазлов собрано — в облаке платформы (sdk.cloud): счёт общий на всех устройствах ребёнка.
import type { GameSdk } from '@ig/sdk';

interface Solved {
  count: number;
}

const KEY = 'solved';

export const reportPlace = (sdk: GameSdk, ok: boolean) => sdk.progress.skill('space', ok);

async function bumpSolved(sdk: GameSdk): Promise<number> {
  const local = sdk.storage.load<Solved>(`${KEY}:${sdk.profile?.id ?? 'guest'}`)?.count ?? 0;
  const cloud = sdk.profile ? ((await sdk.cloud.load<Solved>(KEY).catch(() => null))?.count ?? 0) : 0;
  const count = Math.max(local, cloud) + 1;
  try {
    sdk.storage.save(`${KEY}:${sdk.profile?.id ?? 'guest'}`, { count });
  } catch {
    // хранилище недоступно — счёт останется в облаке
  }
  if (sdk.profile) await sdk.cloud.save(KEY, { count }).catch(() => undefined);
  return count;
}

/** Пазл собран: total — сколько деталей, own — своя картинка (фото ребёнка или родителя). */
export async function rewardSolved(sdk: GameSdk, total: number, own: boolean) {
  sdk.progress.level(total);
  sdk.progress.sticker('first-puzzle');
  if (total >= 25) sdk.progress.sticker('big-puzzle');
  if (total >= 100) sdk.progress.sticker('huge-puzzle');
  if (own) sdk.progress.sticker('own-picture');
  if ((await bumpSolved(sdk)) >= 10) sdk.progress.sticker('ten-puzzles');
}
