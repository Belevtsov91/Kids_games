import type { GameProgress } from '@ig/sdk';
import { allAnimals } from '../game/data';

// Награды платформы за раунд: уровень, навык «природа» и наклейки (их видно в альбоме ребёнка и в кабинете).

export function rewardRound(progress: GameProgress, level: number, mistakes: number, foundCount: number) {
  progress.level(level);
  progress.skill('nature', mistakes <= 2);
  progress.sticker('first-home');
  if (mistakes === 0) progress.sticker('no-mistakes');
  if (foundCount * 2 >= allAnimals.length) progress.sticker('half-album');
  if (foundCount >= allAnimals.length) progress.sticker('full-album');
}
