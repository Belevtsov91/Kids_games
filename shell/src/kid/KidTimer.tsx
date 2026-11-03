import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AskTime } from './AskTime';
import { useKidStatus } from './KidStatus';
import { TimeRing } from './TimeRing';
import { useKidText } from './text';

/** Таймер в верхней панели: сколько осталось играть. По нажатию — подробности и «попросить ещё». */
export function KidTimer({ className = '' }: { className?: string }) {
  const { status } = useKidStatus();
  const k = useKidText();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    addEventListener('pointerdown', onDown);
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('pointerdown', onDown);
      removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!status) return null;
  const { time } = status;
  const low = time.remaining !== null && time.remaining <= 5;
  const label =
    time.blocked === 'quiet' ? k.timer.quiet : time.blocked === 'limit' ? k.timer.over : time.remaining === null ? k.timer.unlimited : k.hm(time.remaining);

  return (
    <div className={`kid-timer ${className}`} ref={box}>
      <button
        type="button"
        className={`dash-chip kid-timer-chip${low || time.blocked ? ' is-low' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${k.timer.label}: ${label}`}
        onClick={() => setOpen(!open)}
        data-testid="kid-timer"
      >
        <span aria-hidden="true">{time.blocked === 'quiet' ? '🌙' : '⏳'}</span>
        <span className="kid-timer-left">{label}</span>
      </button>
      {open && (
        <div className="dash-menu kid-timer-pop">
          <div className="kid-timer-head">
            <TimeRing time={time} size={84} />
            <div>
              <strong>{k.timer.label}</strong>
              <p>{time.limit === null ? k.me.noLimit : k.me.of(time.usedMinutes, time.limit)}</p>
              {low && !time.blocked && <p className="kid-timer-soon">{k.timeUp.soon(time.remaining!)}</p>}
            </div>
          </div>
          {time.limit !== null && <AskTime />}
          <Link to="/me" className="dash-menu-link">{k.me.open} →</Link>
        </div>
      )}
    </div>
  );
}
