import { useEffect, useRef, useState, type ReactNode } from 'react';

const HOLD_MS = 2000;

/**
 * Кнопка, которая срабатывает только после удержания (2 секунды). Малыш не выйдет из игры случайно,
 * а взрослый поймёт по кольцу прогресса. Клавиатура: удержание Enter или пробела.
 */
export function HoldButton({ onDone, label, className, children }: { onDone: () => void; label: string; className?: string; children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const start = useRef<number | null>(null);
  const frame = useRef(0);

  const stop = () => {
    start.current = null;
    cancelAnimationFrame(frame.current);
    setProgress(0);
  };
  const tick = () => {
    if (start.current === null) return;
    const p = Math.min(1, (performance.now() - start.current) / HOLD_MS);
    setProgress(p);
    if (p >= 1) {
      stop();
      onDone();
    } else frame.current = requestAnimationFrame(tick);
  };
  const begin = () => {
    if (start.current !== null) return;
    start.current = performance.now();
    frame.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return (
    <button
      type="button"
      className={`hold-button ${className ?? ''}`}
      aria-label={label}
      title={label}
      style={{ ['--hold' as string]: `${progress * 360}deg` }}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), begin())}
      onKeyUp={stop}
    >
      {children}
    </button>
  );
}
