import { useEffect, useState, type RefObject } from 'react';
import { useI18n } from '@/i18n/I18nProvider';

// Игра упала во время игры (не при запуске): необработанные ошибки, пока она открыта.
// Одна случайная ошибка — не повод закрывать игру. Показываем экран, если игра опустела
// или ошибки сыплются подряд. Сообщение уходит на сервер без данных о ребёнке.

const BURST = 3;
const BURST_MS = 5000;

function report(message: string) {
  const body = JSON.stringify({ path: location.pathname.slice(0, 80), message: message.slice(0, 300) });
  void fetch('/api/errors', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => undefined);
}

export function useGameCrash(container: RefObject<HTMLDivElement | null>, attempt: number) {
  const [crashed, setCrashed] = useState(false);
  useEffect(() => {
    setCrashed(false);
    let times: number[] = [];
    const onError = (message: string) => {
      report(message);
      const now = Date.now();
      times = [...times.filter((t) => now - t < BURST_MS), now];
      if (times.length >= BURST || !container.current?.childElementCount) setCrashed(true);
    };
    const onWindowError = (e: ErrorEvent) => onError(e.message || 'error');
    const onRejection = (e: PromiseRejectionEvent) => onError(String(e.reason?.message ?? e.reason ?? 'rejection'));
    addEventListener('error', onWindowError);
    addEventListener('unhandledrejection', onRejection);
    return () => {
      removeEventListener('error', onWindowError);
      removeEventListener('unhandledrejection', onRejection);
    };
  }, [container, attempt]);
  return crashed;
}

/** Детский экран «ой» с двумя большими кнопками. */
export function GameCrash({ onRetry, onExit }: { onRetry: () => void; onExit: () => void }) {
  const { t } = useI18n();
  return (
    <div className="game-crash" role="alertdialog">
      <span className="game-crash-face" aria-hidden="true">🙈</span>
      <p>{t.game.crashed}</p>
      <div className="game-crash-actions">
        <button type="button" className="btn btn-primary" onClick={onRetry}>🔄 {t.game.again}</button>
        <button type="button" className="btn btn-secondary" onClick={onExit}>🏠 {t.game.toMenu}</button>
      </div>
    </div>
  );
}
