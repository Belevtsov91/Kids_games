import type { GameSdk } from '@ig/sdk';

// Успехи для альбома наклеек и кабинета (sdk.progress): навыки «буквы» и «чтение», уровни, наклейки.

/** Слово собрано; ok — без ошибок и подсказок. */
export function wordDone(sdk: GameSdk, ok: boolean) {
  sdk.progress.skill('letters', ok);
  sdk.progress.sticker('first-word');
}

/** Уровень пройден со звёздами 1–3. */
export function levelDone(sdk: GameSdk, levelIndex: number, stars: number, last: boolean) {
  sdk.progress.level(String(levelIndex + 1));
  sdk.progress.skill('reading', stars >= 2);
  if (stars === 3) sdk.progress.sticker('three-stars');
  if (last) sdk.progress.sticker('champion');
}
