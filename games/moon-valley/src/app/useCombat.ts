// Бой и сердечки: взмах жезлом, очищенные слаймы, урон герою (обморок — домой), Грибной король.
// Сердечки понемногу возвращаются сами, пока игра идёт.

import { useCallback, useEffect, useState } from 'react';
import { calmBoss, cleanseSlime, type ValleyState } from '../game/valley';
import { HERO_SPAWN } from '../game/world';
import type { Effect } from '../audio/sound';
import { tr } from '../i18n';
import { CAST_COOLDOWN, MAX_HEARTS, type Runtime } from './runtime';

interface Deps {
  runtime: Runtime;
  active: boolean;
  update: (next: (current: ValleyState) => ValleyState) => void;
  sound: (effect: Effect, volume?: number) => void;
  toast: (text: string) => void;
}

export function useCombat({ runtime, active, update, sound, toast }: Deps) {
  const [hearts, setHearts] = useState(MAX_HEARTS);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      if (runtime.hearts > 0 && runtime.hearts < MAX_HEARTS && runtime.time - runtime.invulnerableUntil > 8) {
        runtime.hearts += 1;
        setHearts(runtime.hearts);
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [active, runtime]);

  const cast = useCallback(() => {
    if (runtime.time - runtime.castTime < CAST_COOLDOWN || runtime.hearts <= 0) return;
    runtime.cast += 1;
    runtime.castTime = runtime.time;
    runtime.action = { name: 'cast', until: runtime.time + 0.45 };
    sound('cast', 0.35);
  }, [runtime, sound]);

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

  return { hearts, cast, onCleanse, onHurt, onBossHit, onCalmBoss };
}
