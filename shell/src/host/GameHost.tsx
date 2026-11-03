import { useEffect, useRef, useState } from 'react';
import type { GameInstance, GameManifest, GameSdk } from '@ig/sdk';
import { loadGame } from '@/catalog/catalog';
import { useI18n } from '@/i18n/I18nProvider';
import type { Child } from '@/auth/AuthContext';
import { createSdk } from './createSdk';
import { GameCrash, useGameCrash } from './GameCrash';

interface Props {
  manifest: GameManifest;
  profile: GameSdk['profile'];
  /** Профиль целиком: удобство и режим малыша для sdk.comfort. */
  child?: Child | null;
  /** Игра выдала наклейку. */
  onSticker?: (id: string) => void;
  onExit: () => void;
  /** Перерыв: игра на паузе под экраном «Потянись». */
  paused?: boolean;
}

/**
 * Запускает игру в своём контейнере через mount() и гасит через unmount().
 * Чем игра рисует (React, Pixi, Three…), оболочке неважно.
 */
export function GameHost({ manifest, profile, child, onSticker, onExit, paused = false }: Props) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef(onExit);
  exitRef.current = onExit;
  // Профиль берётся на момент запуска; смена профиля внутри игры не предусмотрена.
  const profileRef = useRef(profile);
  const extrasRef = useRef({ child, onSticker });
  extrasRef.current = { child, onSticker };
  const [attempt, setAttempt] = useState(0);
  const crashed = useGameCrash(containerRef, attempt);
  const [state, setState] = useState<'loading' | 'running' | 'error'>('loading');
  const instanceRef = useRef<GameInstance | null>(null);

  useEffect(() => {
    const instance = instanceRef.current;
    if (paused) instance?.pause?.();
    else instance?.resume?.();
  }, [paused, state]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let instance: GameInstance | null = null;
    let disposed = false;
    let flush = () => {};

    const onVisibility = () => (document.hidden ? instance?.pause?.() : instance?.resume?.());

    (async () => {
      try {
        const game = await loadGame(manifest.id);
        if (disposed) return;
        const sdk = createSdk(manifest, profileRef.current, () => exitRef.current(), {
          child: extrasRef.current.child,
          onSticker: (id) => extrasRef.current.onSticker?.(id),
        });
        flush = sdk.progress.flush;
        const mounted = await game.mount(container, sdk);
        // StrictMode и быстрый выход: игру могли закрыть, пока она запускалась.
        if (disposed) return void queueMicrotask(() => mounted.unmount());
        instance = mounted;
        instanceRef.current = mounted;
        document.addEventListener('visibilitychange', onVisibility);
        setState('running');
      } catch (err) {
        console.error(`Не удалось запустить игру ${manifest.id}`, err);
        if (!disposed) setState('error');
      }
    })();

    return () => {
      disposed = true;
      flush();
      document.removeEventListener('visibilitychange', onVisibility);
      // Не во время коммита React оболочки: у игры может быть свой React-корень, и React запрещает
      // синхронно размонтировать его посреди чужого рендера.
      const running = instance;
      instance = null;
      instanceRef.current = null;
      if (running) queueMicrotask(() => running.unmount());
    };
  }, [manifest, attempt]);

  return (
    <>
      <div ref={containerRef} className="game-container" data-testid="game-container" data-state={state} />
      {state === 'loading' && <div className="loading">{t.common.loading}</div>}
      {state === 'error' && <div className="loading">{t.game.failed}</div>}
      {crashed && state === 'running' && <GameCrash onRetry={() => setAttempt((n) => n + 1)} onExit={() => exitRef.current()} />}
    </>
  );
}
