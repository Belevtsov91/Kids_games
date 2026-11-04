// Новый уровень: звук, сообщение и сообщения о питомцах, которые вышли из тумана на этом уровне.

import { useEffect, useRef } from 'react';
import { PET_UNLOCK, type ValleyState } from '../game/valley';
import type { Effect } from '../audio/sound';
import { tr } from '../i18n';

export function useLevelUps(state: ValleyState, sound: (effect: Effect, volume?: number) => void, toast: (text: string) => void) {
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
}
