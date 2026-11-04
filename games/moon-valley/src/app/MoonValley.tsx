// Контроллер игры: собирает вместе заставку, 3D-мир и интерфейс.
// Логика разложена по хукам рядом:
//   useValleySave  — состояние долины и сохранение      useValleyAudio — музыка и звуки
//   useToasts      — всплывающие сообщения               useLevelUps    — новый уровень и питомцы
//   useInteract    — кнопка «действие» (interact.ts)     useCombat      — жезл, слаймы, сердечки, босс
//   useControls    — клавиатура, мышь и тач              actionLabel    — подпись на кнопке действия

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameSdk } from '@ig/sdk';
import type { ValleyState } from '../game/valley';
import { questView } from '../game/quests';
import { valleySound } from '../audio/sound';
import { SceneErrorBoundary } from '../scene/SceneErrorBoundary';
import { World } from '../scene/World';
import { ActionButtons, Dialog, Joystick, Loading, QuestLog, QuestTracker, Toasts, TopBar } from '../ui/hud';
import { Intro } from '../ui/Intro';
import { actionLabel } from './actionLabel';
import { useControls } from './controls';
import { usePaused, type Pause } from './pause';
import { createRuntime, RuntimeContext, type Target } from './runtime';
import { useCombat } from './useCombat';
import { useInteract } from './useInteract';
import { useLevelUps } from './useLevelUps';
import { useRewards } from './useRewards';
import { useToasts } from './useToasts';
import { useValleyAudio } from './useValleyAudio';
import { useValleySave } from './useValleySave';
import { tr } from '../i18n';
import '../styles/index.css';

export function MoonValley({ sdk, pause }: { sdk: GameSdk; pause: Pause }) {
  const { state, setState, status, ready } = useValleySave(sdk);
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
  const [log, setLog] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const touch = useMemo(() => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches, []);

  const { toasts, toast } = useToasts();
  const sound = useValleyAudio(sdk, started, paused);
  useLevelUps(state, sound, toast);
  useRewards(sdk, state, ready);
  const update = useCallback((next: (current: ValleyState) => ValleyState) => setState(next), [setState]);
  const { hearts, cast, onCleanse, onHurt, onBossHit, onCalmBoss } = useCombat({ runtime, active: started && !paused, update, sound, toast });
  const { act, dialog, setDialog, happy, talk } = useInteract({ runtime, stateRef, update, sound, toast, setTarget });

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
    [act, cast, dialog, log, setDialog],
  );
  useControls(runtime, sceneRef, started && !paused, handlers);

  const view = questView(state);
  const bossActive = view.quest?.kind === 'boss' && view.status !== 'offer';

  const start = () => {
    setStarted(true);
    valleySound.warmUp();
  };

  if (!started) return <Intro state={state} onStart={start} onExit={sdk.exit} />;

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
