import type { GameSdk } from '@ig/sdk';
import { QUESTS, type Quest } from '../game/quests';

// Успехи для альбома наклеек и кабинета (sdk.progress): каждое задание — уровень,
// творчество и пространство как навыки, наклейки за первое задание, фонари и все задания.

export function reportQuests(sdk: GameSdk, done: Quest[], total: number) {
  for (const quest of done) {
    sdk.progress.level(quest.id);
    sdk.progress.skill(quest.id === 'tower' || quest.id === 'digger' ? 'space' : 'creativity', true);
    if (quest.id === 'lights') sdk.progress.sticker('lantern-keeper');
  }
  sdk.progress.sticker('first-quest');
  if (total >= QUESTS.length) sdk.progress.sticker('island-master');
}
