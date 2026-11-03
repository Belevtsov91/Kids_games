import { useEffect, useRef, useState } from 'react';
import type { GameInstance, GameManifest, GameSdk } from '@ig/sdk';
import { loadGame } from '@/catalog/catalog';
import { useI18n } from '@/i18n/I18nProvider';
import { createSdk } from './createSdk';

interface Props {
  manifest: GameManifest;
  profile: GameSdk['profile'];
  onExit: () => void;
}

/**
 * Запускает игру в своём контейнере через mount() и гасит через unmount().
 * Чем игра рисует (React, Pixi, Three…), оболочке неважно.
 */
export function GameHost({ manifest, profile, onExit }: Props) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef(onExit);
  exitRef.current = onExit;
  // Профиль берётся на момент запуска; смена профиля внутри игры не предусмотрена.
  const profileRef = useRef(profile);
  const [state, setState] = useState<'loading' | 'running' | 'error'>('loading');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let instance: GameInstance | null = null;
    let disposed = false;

    const onVisibility = () => (document.hidden ? instance?.pause?.() : instance?.resume?.());

    (async () => {
      try {
        const game = await loadGame(manifest.id);
        if (disposed) return;
        const mounted = await game.mount(container, createSdk(manifest, profileRef.current, () => exitRef.current()));
        // StrictMode и быстрый выход: игру могли закрыть, пока она запускалась.
        if (disposed) return void queueMicrotask(() => mounted.unmount());
        instance = mounted;
        document.addEventListener('visibilitychange', onVisibility);
        setState('running');
      } catch (err) {
        console.error(`Не удалось запустить игру ${manifest.id}`, err);
        if (!disposed) setState('error');
      }
    })();

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      // Не во время коммита React оболочки: у игры может быть свой React-корень, и React запрещает
      // синхронно размонтировать его посреди чужого рендера.
      const running = instance;
      instance = null;
      if (running) queueMicrotask(() => running.unmount());
    };
  }, [manifest]);

  return (
    <>
      <div ref={containerRef} className="game-container" data-testid="game-container" data-state={state} />
      {state === 'loading' && <div className="loading">{t.common.loading}</div>}
      {state === 'error' && <div className="loading">{t.game.failed}</div>}
    </>
  );
}
