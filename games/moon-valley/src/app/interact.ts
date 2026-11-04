// Что происходит, когда герой нажимает «действие» возле цели: грядка, житель, кристалл, сундук,
// колодец, теплица, питомец или Грибной король. Один обработчик на каждый вид цели.
// Здесь нет React: хук useInteract передаёт сюда состояние и функции, которые меняют экран.

import {
  befriend,
  buildGreenhouse,
  collectCrystal,
  cropOf,
  drawWater,
  GREENHOUSE_COST,
  openChest,
  tendPlot,
  type PetKind,
  type ValleyState,
} from '../game/valley';
import { QUESTS, rewardText, talkTo, type NpcId } from '../game/quests';
import { valleySound, type Effect } from '../audio/sound';
import { tr } from '../i18n';
import type { Runtime, Target, TargetKind } from './runtime';

export type DialogState = { npc: NpcId | 'king'; text: string } | null;

export interface InteractContext {
  runtime: Runtime;
  /** Состояние долины на момент нажатия. */
  state: ValleyState;
  update: (next: (current: ValleyState) => ValleyState) => void;
  toast: (text: string) => void;
  sound: (effect: Effect, volume?: number) => void;
  setDialog: (dialog: DialogState) => void;
  setTarget: (target: Target | null) => void;
  markTalk: (npc: NpcId) => void;
  markHappy: (pet: PetKind) => void;
}

type Handler = (ctx: InteractContext, id: string) => void;

const plot: Handler = ({ state: s, update, toast, sound }, rawId) => {
  const id = Number(rawId);
  const before = s.plots[id];
  const next = tendPlot(s, id);
  if (next === s) {
    toast(before?.stage === 0 ? tr().toast.needSeeds : tr().toast.needWater);
    sound('ui', 0.3);
    return;
  }
  update(() => next);
  if (before?.stage === 3) {
    sound('coin');
    toast(tr().toast.harvest(tr().crops[cropOf(id)]));
  } else {
    valleySound.chime();
    toast(before?.stage === 0 ? tr().toast.planted : before?.stage === 2 ? tr().toast.ripe : tr().toast.growing);
  }
};

const npc: Handler = ({ runtime, state: s, update, toast, sound, setDialog, markTalk }, id) => {
  const who = id as NpcId;
  const result = talkTo(s, who, Math.floor(runtime.time));
  update(() => result.state);
  setDialog({ npc: who, text: result.lines.join(' ') });
  markTalk(who);
  runtime.action = { name: 'wave', until: runtime.time + 1 };
  if (result.event === 'accepted') {
    sound('quest');
    toast(tr().toast.newQuest(QUESTS[s.quest.index]?.title ?? ''));
  } else if (result.event === 'completed') {
    sound('level', 0.6);
    const quest = QUESTS[s.quest.index];
    if (quest) toast(tr().toast.questDone(rewardText(quest.reward)));
  } else sound('ui', 0.3);
};

const crystal: Handler = ({ runtime, update, toast, sound, setTarget }, id) => {
  runtime.crystalTaken.set(id, runtime.time);
  runtime.target = null;
  setTarget(null);
  update(collectCrystal);
  sound('gem');
  toast(tr().toast.crystal);
};

const chest: Handler = ({ update, toast, sound }, id) => {
  update((value) => openChest(value, id));
  sound('coin');
  toast(tr().toast.chest);
};

const well: Handler = ({ update, toast }) => {
  update(drawWater);
  valleySound.chime();
  toast(tr().toast.well);
};

const greenhouse: Handler = ({ state: s, update, toast, sound }) => {
  const next = buildGreenhouse(s);
  if (next === s) {
    toast(tr().toast.needStar(GREENHOUSE_COST));
    sound('ui', 0.3);
    return;
  }
  update(() => next);
  sound('level', 0.6);
  toast(tr().toast.built);
};

const pet: Handler = ({ update, toast, markHappy }, rawId) => {
  const id = rawId as PetKind;
  update((value) => befriend(value, id));
  markHappy(id);
  valleySound.chime();
  toast(tr().toast.petHappy(tr().pets[id]));
};

const boss: Handler = ({ setDialog }) => setDialog({ npc: 'king', text: tr().toast.kingThanks });

const HANDLERS: Record<TargetKind, Handler> = { plot, npc, crystal, chest, well, greenhouse, pet, boss };

/** Выполнить действие с целью. Анимацию «взаимодействия» включаем до обработчика, как и раньше. */
export function interact(ctx: InteractContext, target: Target) {
  ctx.runtime.action = { name: 'interact', until: ctx.runtime.time + 0.55 };
  HANDLERS[target.kind](ctx, target.id);
}
