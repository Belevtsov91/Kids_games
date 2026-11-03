// Контроллер игры: заставка, мир, действия героя, квесты, сердечки, сохранение и звук.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameSdk } from '@ig/sdk';
import cover from '../../assets/moon-valley-cover.png';
import {
  befriend,
  buildGreenhouse,
  calmBoss,
  cleanseSlime,
  collectCrystal,
  cropOf,
  drawWater,
  GREENHOUSE_COST,
  openChest,
  PET_UNLOCK,
  tendPlot,
  type PetKind,
  type ValleyState,
} from '../game/valley';
import { NPC_NAMES, QUESTS, questView, rewardText, talkTo, type NpcId } from '../game/quests';
import { HERO_SPAWN } from '../game/world';
import { valleySound, type Effect } from '../audio/sound';
import { SceneErrorBoundary } from '../scene/SceneErrorBoundary';
import { World } from '../scene/World';
import { ActionButtons, Dialog, Joystick, Loading, QuestLog, QuestTracker, Toasts, TopBar } from '../ui/Hud';
import { useControls } from './controls';
import { usePaused, type Pause } from './pause';
import { CAST_COOLDOWN, createRuntime, MAX_HEARTS, RuntimeContext, type Target } from './runtime';
import { useValleySave } from './useValleySave';
import { tr } from '../i18n';
import '../styles/index.css';

function actionLabel(target: Target | null, state: ValleyState): string | null {
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

export function MoonValley({ sdk, pause }: { sdk: GameSdk; pause: Pause }) {
  const { state, setState, status } = useValleySave(sdk);
  const paused = usePaused(pause);
  const runtime = useMemo(createRuntime, []);
  // В режиме разработки мир доступен из консоли (и автотестам): window.__moonValley.
  useEffect(() => {
    if (!import.meta.env?.DEV) return;
    (window as unknown as { __moonValley?: unknown }).__moonValley = runtime;
    return () => void delete (window as unknown as { __moonValley?: unknown }).__moonValley;
  }, [runtime]);
  const [started, setStarted] = useState(false);
  const [night, setNight] = useState(false);
  const [target, setTarget] = useState<Target | null>(null);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [dialog, setDialog] = useState<{ npc: NpcId | 'king'; text: string } | null>(null);
  const [log, setLog] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [happy, setHappy] = useState<Record<PetKind, number>>({ fox: 0, owl: 0, bunny: 0 });
  const [talk, setTalk] = useState<Record<NpcId, number>>({ granny: 0, miller: 0, ranger: 0 });
  const sceneRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const toastId = useRef(0);
  const touch = useMemo(() => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches, []);

  const toast = useCallback((text: string) => {
    const id = ++toastId.current;
    setToasts((items) => [...items.slice(-2), { id, text }]);
    setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3200);
  }, []);
  const sound = useCallback((effect: Effect, volume?: number) => valleySound.play(effect, volume), []);

  // Звук: общий выключатель оболочки, музыка — только в мире и пока вкладка видна.
  const [muted, setMuted] = useState(sdk.audio.muted);
  useEffect(() => {
    valleySound.setMuted(sdk.audio.muted);
    const stop = sdk.audio.onMuteChange((value) => {
      valleySound.setMuted(value);
      setMuted(value);
    });
    return () => {
      stop();
      valleySound.dispose();
    };
  }, [sdk]);
  useEffect(() => {
    if (started && !paused && !muted) valleySound.start();
    else valleySound.stop();
  }, [started, paused, muted]);

  // Новый уровень и новые питомцы.
  const level = useRef(state.level);
  useEffect(() => {
    if (state.level > level.current) {
      sound('level', 0.6);
      toast(tr().toast.level(state.level));
      for (const pet of state.pets)
        if (PET_UNLOCK[pet.id] === state.level && PET_UNLOCK[pet.id] > level.current) toast(tr().toast.petFree(tr().pets[pet.id]));
    }
    level.current = state.level;
  }, [state.level, state.pets, sound, toast]);

  // Сердечки понемногу возвращаются.
  useEffect(() => {
    if (!started || paused) return;
    const timer = setInterval(() => {
      if (runtime.hearts > 0 && runtime.hearts < MAX_HEARTS && runtime.time - runtime.invulnerableUntil > 8) {
        runtime.hearts += 1;
        setHearts(runtime.hearts);
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [started, paused, runtime]);

  const update = useCallback((next: (current: ValleyState) => ValleyState) => setState(next), [setState]);

  const act = useCallback(() => {
    const current = runtime.target;
    const s = stateRef.current;
    if (dialog) return setDialog(null);
    if (!current) return;
    runtime.action = { name: 'interact', until: runtime.time + 0.55 };
    switch (current.kind) {
      case 'plot': {
        const id = Number(current.id);
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
        return;
      }
      case 'npc': {
        const npc = current.id as NpcId;
        const result = talkTo(s, npc, Math.floor(runtime.time));
        update(() => result.state);
        setDialog({ npc, text: result.lines.join(' ') });
        setTalk((value) => ({ ...value, [npc]: runtime.time }));
        runtime.action = { name: 'wave', until: runtime.time + 1 };
        if (result.event === 'accepted') {
          sound('quest');
          toast(tr().toast.newQuest(QUESTS[s.quest.index]?.title ?? ''));
        } else if (result.event === 'completed') {
          sound('level', 0.6);
          const quest = QUESTS[s.quest.index];
          if (quest) toast(tr().toast.questDone(rewardText(quest.reward)));
        } else sound('ui', 0.3);
        return;
      }
      case 'crystal':
        runtime.crystalTaken.set(current.id, runtime.time);
        runtime.target = null;
        setTarget(null);
        update(collectCrystal);
        sound('gem');
        toast(tr().toast.crystal);
        return;
      case 'chest':
        update((value) => openChest(value, current.id));
        sound('coin');
        toast(tr().toast.chest);
        return;
      case 'well':
        update(drawWater);
        valleySound.chime();
        toast(tr().toast.well);
        return;
      case 'greenhouse': {
        const next = buildGreenhouse(s);
        if (next === s) {
          toast(tr().toast.needStar(GREENHOUSE_COST));
          sound('ui', 0.3);
          return;
        }
        update(() => next);
        sound('level', 0.6);
        toast(tr().toast.built);
        return;
      }
      case 'pet': {
        const id = current.id as PetKind;
        update((value) => befriend(value, id));
        setHappy((value) => ({ ...value, [id]: runtime.time }));
        valleySound.chime();
        toast(tr().toast.petHappy(tr().pets[id]));
        return;
      }
      case 'boss':
        setDialog({ npc: 'king', text: tr().toast.kingThanks });
        return;
    }
  }, [dialog, runtime, toast, sound, update]);

  const cast = useCallback(() => {
    if (runtime.time - runtime.castTime < CAST_COOLDOWN || runtime.hearts <= 0) return;
    runtime.cast += 1;
    runtime.castTime = runtime.time;
    runtime.action = { name: 'cast', until: runtime.time + 0.45 };
    sound('cast', 0.35);
  }, [runtime, sound]);

  const jump = useCallback(() => {
    runtime.input.jump = true;
  }, [runtime]);

  const handlers = useMemo(
    () => ({
      act,
      cast,
      toggleLog: () => setLog((value) => !value),
      close: () => {
        if (dialog) {
          setDialog(null);
          return true;
        }
        if (log) {
          setLog(false);
          return true;
        }
        return false;
      },
    }),
    [act, cast, dialog, log],
  );
  useControls(runtime, sceneRef, started && !paused, handlers);

  const onCleanse = useCallback(
    (big: boolean) => {
      update((value) => cleanseSlime(value, big));
      sound('poof', 0.5);
      toast(big ? tr().toast.bigSlime : tr().toast.slime);
    },
    [update, sound, toast],
  );
  const onHurt = useCallback(() => {
    sound('hurt', 0.5);
    setHearts(runtime.hearts);
    if (runtime.hearts <= 0) {
      toast(tr().toast.hurt);
      setTimeout(() => {
        runtime.teleport = runtime.hero.clone().set(HERO_SPAWN[0], 0, HERO_SPAWN[1]);
        runtime.hearts = MAX_HEARTS;
        runtime.invulnerableUntil = runtime.time + 2;
        setHearts(MAX_HEARTS);
      }, 1100);
    }
  }, [runtime, sound, toast]);
  const onBossHit = useCallback(
    (left: number) => {
      sound('poof', 0.4);
      if (left > 0 && left % 3 === 0) toast(tr().toast.kingLeft(left));
    },
    [sound, toast],
  );
  const onCalmBoss = useCallback(() => {
    update(calmBoss);
    sound('level', 0.7);
    toast(tr().toast.kingDance);
  }, [update, sound, toast]);

  const view = questView(state);
  const bossActive = view.quest?.kind === 'boss' && view.status !== 'offer';

  const start = () => {
    setStarted(true);
    valleySound.warmUp();
  };

  if (!started)
    return (
      <main
        className="mv-intro"
        style={{ backgroundImage: `linear-gradient(90deg, rgb(14 25 54 / .84), rgb(14 25 54 / .2)), url(${cover})` }}
      >
        <section>
          <span className="mv-moon">☾</span>
          <p>{tr().intro.tag}</p>
          <h1>
            {tr().intro.title[0]}
            <br />
            {tr().intro.title[1]}
          </h1>
          <p>{tr().intro.text}</p>
          <button onClick={start}>{state.quest.index > 0 || state.level > 1 ? tr().intro.resume(state.level) : tr().intro.start} ✨</button>
          <button className="mv-link" onClick={sdk.exit}>
            {tr().intro.menu}
          </button>
        </section>
      </main>
    );

  return (
    <RuntimeContext.Provider value={runtime}>
      <main className="moon-valley">
        <div className="mv-scene" ref={sceneRef}>
          <SceneErrorBoundary>
            <World
              state={state}
              night={night}
              paused={paused}
              happy={happy}
              talk={talk}
              bossActive={bossActive}
              onTarget={setTarget}
              onCleanse={onCleanse}
              onHurt={onHurt}
              onBossHit={onBossHit}
              onCalmBoss={onCalmBoss}
            />
          </SceneErrorBoundary>
        </div>
        <TopBar
          state={state}
          hearts={hearts}
          night={night}
          saveText={tr().save[status]}
          onNight={() => setNight((value) => !value)}
          onLog={() => setLog(true)}
        />
        <QuestTracker state={state} onOpen={() => setLog(true)} />
        <Toasts items={toasts} />
        {touch && <Joystick runtime={runtime} />}
        {!touch && <div className="mv-keys">{tr().hud.keys}</div>}
        <ActionButtons label={dialog ? null : actionLabel(target, state)} onAct={act} onCast={cast} onJump={jump} />
        {dialog && <Dialog npc={dialog.npc} text={dialog.text} onClose={() => setDialog(null)} />}
        {log && <QuestLog state={state} onClose={() => setLog(false)} />}
        <Loading />
      </main>
    </RuntimeContext.Provider>
  );
}
