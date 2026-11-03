// Цепочка квестов: житель даёт задание, герой выполняет и возвращается за наградой.

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
  granny: 'Бабушка Ива',
  miller: 'Мельник Тимофей',
  ranger: 'Следопыт Рина',
};

export const QUESTS: Quest[] = [
  {
    id: 'first-harvest',
    giver: 'granny',
    title: 'Первый урожай',
    offer: 'Здравствуй, Хранитель! Грядки у дома совсем заскучали. Посади семечко, полей дважды и собери урожай. Два раза!',
    goal: 'Собери урожай с грядок',
    kind: 'harvest',
    need: 2,
    thanks: 'Какие чудесные овощи! Держи семена и воду, пригодятся.',
    reward: { xp: 20, starlight: 10, seeds: 3, water: 3 },
  },
  {
    id: 'spark-friend',
    giver: 'granny',
    title: 'Лучший друг',
    offer: 'Искорка ходит за тобой хвостиком. Погладь её несколько раз, пусть знает, что ты её друг.',
    goal: 'Подружись с Искоркой',
    kind: 'friend',
    need: 1,
    thanks: 'Смотри, как она сияет! Друзья делают долину светлее.',
    reward: { xp: 20, starlight: 8 },
  },
  {
    id: 'moon-crystals',
    giver: 'miller',
    title: 'Лунные кристаллы',
    offer: 'Моя мельница мелет лунный свет, но кристаллы раскатились по всей долине. Принеси пять штук, а?',
    goal: 'Собери лунные кристаллы',
    kind: 'crystals',
    need: 5,
    thanks: 'Вот это да! Мельница снова закрутилась. Вот тебе звёздный свет.',
    reward: { xp: 30, starlight: 15, water: 3 },
  },
  {
    id: 'greenhouse',
    giver: 'granny',
    title: 'Тёплая оранжерея',
    offer: 'Старая оранжерея у дома развалилась. Накопи звёздного света и построй её заново, там растения растут веселее.',
    goal: 'Построй оранжерею у дома',
    kind: 'build',
    need: 1,
    thanks: 'Как красиво сияет стекло! Спасибо, Хранитель.',
    reward: { xp: 30, seeds: 4 },
  },
  {
    id: 'shadow-slimes',
    giver: 'ranger',
    title: 'Теневые слаймы',
    offer: 'В лесу бродят теневые слаймы: они глотают свет. Махни волшебным жезлом, и свет вернёт им радость. Очисти шестерых.',
    goal: 'Очисти теневых слаймов',
    kind: 'cleanse',
    need: 6,
    thanks: 'Лес снова светится! Ты настоящий Хранитель.',
    reward: { xp: 40, starlight: 20 },
  },
  {
    id: 'mushroom-king',
    giver: 'ranger',
    title: 'Грибной король',
    offer: 'На северной поляне проснулся Грибной король. Он не злой, просто ему грустно в темноте. Подари ему много света!',
    goal: 'Успокой Грибного короля на северной поляне',
    kind: 'boss',
    need: 1,
    minLevel: 3,
    thanks: 'Король пляшет! Вся долина слышит его смех.',
    reward: { xp: 50, starlight: 25, seeds: 3 },
  },
  {
    id: 'valley-light',
    giver: 'miller',
    title: 'Свет долины',
    offer: 'Говорят, древние Хранители спрятали в долине три сундука. Найди их все, и долина засияет как прежде.',
    goal: 'Найди три старых сундука',
    kind: 'chests',
    need: 3,
    thanks: 'Ты нашёл всё! Теперь ты главный Хранитель Лунной Долины.',
    reward: { xp: 60, starlight: 40 },
  },
];

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

const SMALL_TALK: Record<NpcId, string[]> = {
  granny: ['Поливай грядки водой из колодца в деревне.', 'Ночью лунные цветы светятся ярче.'],
  miller: ['Ветер сегодня добрый, мельница поёт.', 'Кристаллы растут снова, если подождать.'],
  ranger: ['Слаймы боятся света. Жезл: кнопка ✨ или клавиша F.', 'Олени у озера очень пугливые.'],
};

/** Разговор с жителем: выдать квест, принять выполненный или просто поболтать. */
export function talkTo(state: ValleyState, npc: NpcId, now = 0): Talk {
  const view = questView(state);
  const quest = view.quest;
  const chat = (): Talk => {
    const lines = SMALL_TALK[npc];
    return { state, lines: [lines[now % lines.length]], event: 'chat' };
  };
  if (!quest || quest.giver !== npc) {
    if (quest && view.status !== 'done') return { state, lines: [`${SMALL_TALK[npc][now % 2]} Кстати, тебя ищет ${NPC_NAMES[quest.giver]}.`], event: 'chat' };
    return chat();
  }
  if (view.status === 'offer') {
    if (quest.minLevel && state.level < quest.minLevel)
      return { state, lines: [`Для этого дела нужен опыт. Возвращайся на ${quest.minLevel} уровне!`], event: 'chat' };
    return {
      state: { ...state, quest: { index: state.quest.index, active: true, base: RELATIVE[quest.kind] ? counter(state, quest.kind) : 0 } },
      lines: [quest.offer],
      event: 'accepted',
    };
  }
  if (view.status === 'active') return { state, lines: [`${quest.goal}: ${view.have} из ${view.need}. Я верю в тебя!`], event: 'chat' };
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
  [`+${reward.xp} опыта`, reward.starlight && `+${reward.starlight} ✨`, reward.seeds && `+${reward.seeds} 🌱`, reward.water && `+${reward.water} 💧`]
    .filter(Boolean)
    .join(' · ');
