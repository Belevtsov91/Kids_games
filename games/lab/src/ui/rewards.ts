import type { GameSdk } from '@ig/sdk';
import { LEVELS } from '../game/levels';
import { totalStars, type Best } from '../game/score';

// Успехи лаборатории (sdk.progress): уровень, навыки «логика» и «пространство», наклейки.
export function reportRun(sdk: GameSdk, levelIndex: number, stars: number, best: Best) {
  const lit = stars > 0;
  sdk.progress.skill('logic', lit);
  if (!lit) return;
  sdk.progress.skill('space', true);
  sdk.progress.level(levelIndex + 1);
  sdk.progress.sticker('first-light');
  if (stars === 3) sdk.progress.sticker('three-stars');
  if (LEVELS.every((l) => (best[l.id] ?? 0) > 0)) sdk.progress.sticker('all-levels');
  if (totalStars(best) >= LEVELS.length * 3) sdk.progress.sticker('master');
}
