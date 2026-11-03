// Цепочка квестов: житель даёт задание, герой выполняет и возвращается за наградой.

import { tr } from '../i18n';
import { addXp, friendCount, type Stats, type ValleyState } from './valley';

export type NpcId = 'granny' | 'miller' | 'ranger';
export type GoalKind = 'harvest' | 'friend' | 'crystals' | 'build' | 'cleanse' | 'boss' | 'chests';

export interface Reward {
  xp: number;
  starlight?: number;
  seeds?: number;
  water?: number;
}
export interface Quest {
  id: string;
  giver: NpcId;
  title: string;
  /** Что сказать при выдаче. */
  offer: string;
  /** Короткая строка для трекера: «Собери кристаллы». */
  goal: string;
  kind: GoalKind;
  need: number;
  /** С какого уровня житель готов дать квест. */
  minLevel?: number;
  thanks: string;
  reward: Reward;
}

export const NPC_NAMES: Record<NpcId, string> = {
  get granny() { return tr().npcs.granny; },
  get miller() { return tr().npcs.miller; },
  get ranger() { return tr().npcs.ranger; },
};

const BASE: Omit<Quest, 'title' | 'offer' | 'goal' | 'thanks'>[] = [
  {
    id: 'first-harvest',
    giver: 'granny',
    kind: 'harvest',
    need: 2,
    reward: { xp: 20, starlight: 10, seeds: 3, water: 3 },
  },
  {
    id: 'spark-friend',
    giver: 'granny',
    kind: 'friend',
    need: 1,
    reward: { xp: 20, starlight: 8 },
  },
  {
    id: 'moon-crystals',
    giver: 'miller',
    kind: 'crystals',
    need: 5,
    reward: { xp: 30, starlight: 15, water: 3 },
  },
  {
    id: 'greenhouse',
    giver: 'granny',
    kind: 'build',
    need: 1,
    reward: { xp: 30, seeds: 4 },
  },
  {
    id: 'shadow-slimes',
    giver: 'ranger',
    kind: 'cleanse',
    need: 6,
    reward: { xp: 40, starlight: 20 },
  },
  {
    id: 'mushroom-king',
    giver: 'ranger',
    kind: 'boss',
    need: 1,
    minLevel: 3,
    reward: { xp: 50, starlight: 25, seeds: 3 },
  },
  {
    id: 'valley-light',
    giver: 'miller',
    kind: 'chests',
    need: 3,
    reward: { xp: 60, starlight: 40 },
  },
];

/** Тексты квеста берутся на языке игры в момент чтения. */
export const QUESTS: Quest[] = BASE.map((quest) => ({
  ...quest,
  get title() { return tr().quests[quest.id].title; },
  get offer() { return tr().quests[quest.id].offer; },
  get goal() { return tr().quests[quest.id].goal; },
  get thanks() { return tr().quests[quest.id].thanks; },
}));

const RELATIVE: Partial<Record<GoalKind, keyof Stats>> = { harvest: 'harvested', crystals: 'crystals', cleanse: 'cleansed' };

/** Текущее значение счётчика цели. */
function counter(state: ValleyState, kind: GoalKind): number {
  const key = RELATIVE[kind];
  if (key) return state.stats[key];
  if (kind === 'friend') return friendCount(state);
  if (kind === 'build') return state.buildings.includes('greenhouse') ? 1 : 0;
  if (kind === 'boss') return state.stats.boss;
  return state.stats.chests;
}

export type QuestStatus = 'offer' | 'active' | 'ready' | 'done';

export interface QuestView {
  quest: Quest | null;
  status: QuestStatus;
  have: number;
  need: number;
}

export function questView(state: ValleyState): QuestView {
  const quest = QUESTS[state.quest.index] ?? null;
  if (!quest) return { quest: null, status: 'done', have: 0, need: 0 };
  if (!state.quest.active) return { quest, status: 'offer', have: 0, need: quest.need };
  const raw = counter(state, quest.kind) - (RELATIVE[quest.kind] ? state.quest.base : 0);
  const have = Math.max(0, Math.min(quest.need, raw));
  return { quest, status: have >= quest.need ? 'ready' : 'active', have, need: quest.need };
}

export interface Talk {
  state: ValleyState;
  lines: string[];
  /** Что произошло, для звука и подсказок. */
  event: 'accepted' | 'completed' | 'chat';
}

const smallTalk = (npc: NpcId): string[] => tr().smallTalk[npc];

/** Разговор с жителем: выдать квест, принять выполненный или просто поболтать. */
export function talkTo(state: ValleyState, npc: NpcId, now = 0): Talk {
  const view = questView(state);
  const quest = view.quest;
  const chat = (): Talk => {
    const lines = smallTalk(npc);
    return { state, lines: [lines[now % lines.length]], event: 'chat' };
  };
  if (!quest || quest.giver !== npc) {
    if (quest && view.status !== 'done') return { state, lines: [`${smallTalk(npc)[now % 2]} ${tr().talk.lookingFor(NPC_NAMES[quest.giver])}`], event: 'chat' };
    return chat();
  }
  if (view.status === 'offer') {
    if (quest.minLevel && state.level < quest.minLevel)
      return { state, lines: [tr().talk.needLevel(quest.minLevel)], event: 'chat' };
    return {
      state: { ...state, quest: { index: state.quest.index, active: true, base: RELATIVE[quest.kind] ? counter(state, quest.kind) : 0 } },
      lines: [quest.offer],
      event: 'accepted',
    };
  }
  if (view.status === 'active') return { state, lines: [tr().talk.progress(quest.goal, view.have, view.need)], event: 'chat' };
  const { reward } = quest;
  const rewarded = addXp(
    {
      ...state,
      starlight: state.starlight + (reward.starlight ?? 0),
      seeds: state.seeds + (reward.seeds ?? 0),
      water: state.water + (reward.water ?? 0),
      quest: { index: state.quest.index + 1, active: false, base: 0 },
    },
    reward.xp,
  );
  return { state: rewarded, lines: [quest.thanks], event: 'completed' };
}

/** Для подсказки над головой жителя: «!» — есть задание, «?» — можно сдать. */
export function npcMarker(state: ValleyState, npc: NpcId): '!' | '?' | null {
  const view = questView(state);
  if (!view.quest || view.quest.giver !== npc) return null;
  if (view.status === 'offer') return view.quest.minLevel && state.level < view.quest.minLevel ? null : '!';
  if (view.status === 'ready') return '?';
  return null;
}

export const rewardText = (reward: Reward) =>
  [tr().xp(reward.xp), reward.starlight && `+${reward.starlight} ✨`, reward.seeds && `+${reward.seeds} 🌱`, reward.water && `+${reward.water} 💧`]
    .filter(Boolean)
    .join(' · ');
