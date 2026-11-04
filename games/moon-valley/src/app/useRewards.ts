// Успехи для альбома наклеек и кабинета (sdk.progress): задания — уровни, урожай — навык «природа»,
// задания на дружбу и бой — «логика», наклейки за первый урожай, первое задание и всю долину.

import { useEffect, useRef } from 'react';
import type { GameSdk } from '@ig/sdk';
import { QUESTS } from '../game/quests';
import type { ValleyState } from '../game/valley';

export function useRewards(sdk: GameSdk, state: ValleyState, ready: boolean) {
  const seen = useRef<{ quest: number; harvested: number } | null>(null);
  useEffect(() => {
    if (!ready) return;
    const now = { quest: state.quest.index, harvested: state.stats.harvested };
    const before = seen.current;
    seen.current = now;
    // Первый снимок после загрузки сохранения — только запоминаем.
    if (!before) return;
    if (now.harvested > before.harvested) {
      sdk.progress.skill('nature', true);
      sdk.progress.sticker('first-harvest');
    }
    for (let i = before.quest; i < now.quest; i++) {
      const quest = QUESTS[i];
      if (!quest) continue;
      sdk.progress.level(quest.id);
      sdk.progress.skill(quest.kind === 'harvest' || quest.kind === 'cleanse' ? 'nature' : 'logic', true);
      sdk.progress.sticker('first-quest');
    }
    if (now.quest >= QUESTS.length && before.quest < QUESTS.length) sdk.progress.sticker('valley-keeper');
  }, [sdk, ready, state.quest.index, state.stats.harvested]);
}
