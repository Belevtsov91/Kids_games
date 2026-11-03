// Кнопка «действие» (E / пробел / большая кнопка): закрывает диалог или выполняет действие с целью рядом.
// Сами действия описаны в interact.ts; здесь только связь с React-состоянием экрана.

import { useCallback, useState } from 'react';
import type { PetKind, ValleyState } from '../game/valley';
import type { NpcId } from '../game/quests';
import type { Effect } from '../audio/sound';
import { interact, type DialogState } from './interact';
import type { Runtime, Target } from './runtime';

interface Deps {
  runtime: Runtime;
  stateRef: { current: ValleyState };
  update: (next: (current: ValleyState) => ValleyState) => void;
  sound: (effect: Effect, volume?: number) => void;
  toast: (text: string) => void;
  setTarget: (target: Target | null) => void;
}

export function useInteract({ runtime, stateRef, update, sound, toast, setTarget }: Deps) {
  const [dialog, setDialog] = useState<DialogState>(null);
  /** Когда герой последний раз радовал питомца / говорил с жителем (для анимаций в сцене). */
  const [happy, setHappy] = useState<Record<PetKind, number>>({ fox: 0, owl: 0, bunny: 0 });
  const [talk, setTalk] = useState<Record<NpcId, number>>({ granny: 0, miller: 0, ranger: 0 });

  const act = useCallback(() => {
    const current = runtime.target;
    if (dialog) return setDialog(null);
    if (!current) return;
    interact(
      {
        runtime,
        state: stateRef.current,
        update,
        toast,
        sound,
        setDialog,
        setTarget,
        markTalk: (npc) => setTalk((value) => ({ ...value, [npc]: runtime.time })),
        markHappy: (pet) => setHappy((value) => ({ ...value, [pet]: runtime.time })),
      },
      current,
    );
  }, [dialog, runtime, stateRef, toast, sound, update, setTarget]);

  return { act, dialog, setDialog, happy, talk };
}
