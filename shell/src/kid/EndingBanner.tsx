import { useEffect, useState } from 'react';
import { timeBus } from './timeBus';
import { useKidText } from './text';

const SHOW_MS = 6000;

/** «Осталось 2 минуты» поверх любой игры: даже если сама игра sdk.time.onEnding не слушает. */
export function EndingBanner() {
  const k = useKidText();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => timeBus.onEnding((minutes) => setLeft(Math.max(1, minutes))), []);
  useEffect(() => {
    if (left === null) return;
    const id = setTimeout(() => setLeft(null), SHOW_MS);
    return () => clearTimeout(id);
  }, [left]);

  if (left === null) return null;
  return (
    <div className="ending-banner" role="status" aria-live="polite">
      <span aria-hidden="true">⏳</span> {k.timeUp.soon(left)}
    </div>
  );
}
