import { useSyncExternalStore } from 'react';

/** Пауза от оболочки (вкладка скрыта): React-часть игры подписывается на неё. */
export function createPause() {
  let paused = false;
  const listeners = new Set<() => void>();
  return {
    set(value: boolean) {
      paused = value;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get: () => paused,
  };
}
export type Pause = ReturnType<typeof createPause>;

export const usePaused = (pause: Pause) => useSyncExternalStore(pause.subscribe, pause.get, pause.get);
