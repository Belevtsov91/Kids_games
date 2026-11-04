import { lazy, Suspense, useState, useSyncExternalStore, type ReactNode } from 'react';
import { wakeStore } from './serverStatus';

const WakeOverlay = lazy(() => import('./WakeOverlay'));

/**
 * Пока сервер не ответил в первый раз, сайт не рисуем: без сервера не узнать, кто вошёл.
 * Если он спит — поверх всего просыпается мишка. Когда сервер падает посреди игры,
 * мишка появляется поверх игры, а страница под ним остаётся как была: запрос повторится сам.
 */
export function WakeGate({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(wakeStore.subscribe, wakeStore.get);
  const [ready, setReady] = useState(false);
  // Сайт рисуем, как только сервер ответил, — под мишкой, пока он доигрывает подъём.
  if (!ready && (state.phase === 'awake' || state.phase === 'up')) setReady(true);
  const showBear = state.phase === 'asleep' || state.phase === 'awake';
  return (
    <>
      {ready && children}
      {showBear && (
        <Suspense fallback={<div className="wake" />}>
          <WakeOverlay state={state} />
        </Suspense>
      )}
    </>
  );
}
