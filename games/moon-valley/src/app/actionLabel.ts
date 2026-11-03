// Подпись на большой кнопке действия: что случится, если нажать её возле цели («Полить», «Поговорить с …»).

import { GREENHOUSE_COST, type PetKind, type ValleyState } from '../game/valley';
import { NPC_NAMES, type NpcId } from '../game/quests';
import { tr } from '../i18n';
import type { Target } from './runtime';

export function actionLabel(target: Target | null, state: ValleyState): string | null {
  if (!target) return null;
  const a = tr().act;
  switch (target.kind) {
    case 'plot': {
      const plot = state.plots[Number(target.id)];
      if (!plot) return null;
      if (plot.stage === 0) return state.seeds > 0 ? a.plant : a.noSeeds;
      if (plot.stage === 3) return a.harvest;
      return state.water > 0 ? a.water : a.noWater;
    }
    case 'npc':
      return a.talk(NPC_NAMES[target.id as NpcId]);
    case 'crystal':
      return a.crystal;
    case 'chest':
      return a.chest;
    case 'well':
      return a.well;
    case 'greenhouse':
      return a.build(GREENHOUSE_COST);
    case 'pet':
      return a.pet(tr().petsAcc[target.id as PetKind]);
    case 'boss':
      return a.king;
  }
}
