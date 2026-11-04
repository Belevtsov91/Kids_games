import { useEffect, useState } from 'react';
import { newlyDone, type Quest } from '../game/quests';
import { sound } from '../audio/sound';
import type { IslandState } from './useIslandSave';

const TOAST_MS = 3200;
const HINT_MS = 3500;

/** Подсказка внизу экрана: исчезает сама через несколько секунд. */
export function useHint() {
  const [hint, setHint] = useState<string | null>(null);
  useEffect(() => {
    if (!hint) return;
    const timer = setTimeout(() => setHint(null), HINT_MS);
    return () => clearTimeout(timer);
  }, [hint]);
  return [hint, setHint] as const;
}

/**
 * Задания: как только новое выполнено — отмечаем его навсегда и показываем тост.
 * Тосты идут по одному, каждый несколько секунд.
 */
export function useQuestToasts({ ready, world, stats, achieved, setAchieved }: IslandState, onDone?: (done: Quest[], total: number) => void) {
  const [toasts, setToasts] = useState<Quest[]>([]);

  useEffect(() => {
    if (!ready) return;
    const done = newlyDone(world, stats, achieved);
    if (!done.length) return;
    setAchieved((a) => [...a, ...done.map((q) => q.id)]);
    onDone?.(done, achieved.length + done.length);
    setToasts((t) => [...t, ...done]);
    sound.quest();
  }, [ready, world, stats, achieved, setAchieved]);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = setTimeout(() => setToasts((t) => t.slice(1)), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toasts]);

  return toasts;
}
