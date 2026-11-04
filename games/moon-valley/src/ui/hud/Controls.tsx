// Управление на экране: джойстик для пальца и кнопки «действие», «прыжок», «жезл».

import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { Runtime } from '../../app/runtime';
import { tr } from '../../i18n';

/** Экранный джойстик для пальца. */
export function Joystick({ runtime }: { runtime: Runtime }) {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const move = (event: ReactPointerEvent) => {
    const rect = base.current?.getBoundingClientRect();
    if (!rect) return;
    const radius = rect.width / 2;
    let dx = (event.clientX - (rect.left + radius)) / radius;
    let dy = (event.clientY - (rect.top + radius)) / radius;
    const length = Math.hypot(dx, dy);
    if (length > 1) {
      dx /= length;
      dy /= length;
    }
    runtime.input.moveX = dx;
    runtime.input.moveY = -dy;
    runtime.input.walk = false;
    if (knob.current) knob.current.style.transform = `translate(${dx * radius * 0.55}px, ${dy * radius * 0.55}px)`;
  };
  const release = () => {
    pointer.current = null;
    runtime.input.moveX = 0;
    runtime.input.moveY = 0;
    if (knob.current) knob.current.style.transform = '';
  };
  return (
    <div
      ref={base}
      className="mv-joystick"
      onPointerDown={(event) => {
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event);
      }}
      onPointerMove={(event) => pointer.current === event.pointerId && move(event)}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div ref={knob} />
    </div>
  );
}

export function ActionButtons({
  label,
  onAct,
  onCast,
  onJump,
}: {
  label: string | null;
  onAct(): void;
  onCast(): void;
  onJump(): void;
}) {
  return (
    <div className="mv-actions">
      {label && (
        <button className="mv-act" onClick={onAct}>
          <kbd>E</kbd> {label}
        </button>
      )}
      <div>
        <button className="mv-round jump" onClick={onJump} aria-label={tr().hud.jump}>
          ⤴
        </button>
        <button className="mv-round cast" onClick={onCast} aria-label={tr().hud.cast}>
          ✨<small>F</small>
        </button>
      </div>
    </div>
  );
}
