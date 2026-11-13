import { Component, lazy, Suspense, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { wakeStore } from './serverStatus';
import { useWakeText } from './text';

const loadOverlay = () => import('./WakeOverlay');
const WakeOverlay = lazy(loadOverlay);

/** Чанк с мишкой нужен как раз тогда, когда сеть или сервер барахлят: качаем его заранее, в свободную минуту. */
if (typeof window !== 'undefined') {
  const idle = (window as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2500));
  idle(() => void loadOverlay().catch(() => undefined));
}

/** Простой экран без 3D: если чанк с мишкой не загрузился, сайт не превращается в белый лист. */
function PlainWake() {
  const text = useWakeText();
  const state = useSyncExternalStore(wakeStore.subscribe, wakeStore.get);
  return (
    <div className="wake wake-plain" role="status" aria-live="polite">
      <div className="wake-text">
        <div className="wake-card">
          <h1 className="wake-title">{text.title[state.reason]}</h1>
          <p className="wake-lead">{text.lead[state.reason]}</p>
        </div>
      </div>
    </div>
  );
}

class WakeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <PlainWake /> : this.props.children;
  }
}

/** Сколько растворяется экран, если сервер ответил раньше, чем мишка успел встать (как .wake.is-leaving). */
const FADE_MS = 650;

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
  // Мишка уходит не рывком, а растворяется: иначе быстрый ответ сервера выглядит как мигание.
  const [shown, setShown] = useState(showBear);
  if (showBear && !shown) setShown(true);
  useEffect(() => {
    if (showBear || !shown) return;
    const t = window.setTimeout(() => setShown(false), FADE_MS);
    return () => clearTimeout(t);
  }, [showBear, shown]);
  return (
    <>
      {ready && children}
      {shown && (
        <WakeBoundary>
          <Suspense fallback={<div className="wake"><div className="wake-moon" aria-hidden="true" /></div>}>
            <WakeOverlay state={state} fading={!showBear} />
          </Suspense>
        </WakeBoundary>
      )}
    </>
  );
}
