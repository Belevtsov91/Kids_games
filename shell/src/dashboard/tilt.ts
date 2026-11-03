import type { PointerEvent } from 'react';

const canHover = () => matchMedia('(hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Наклон портала за курсором: пишет CSS-переменные --rx/--ry (поворот) и --mx/--my (блик и параллакс картинки). */
export function tilt(max = 10) {
  return {
    onPointerMove(e: PointerEvent<HTMLElement>) {
      if (e.pointerType !== 'mouse' || !canHover()) return;
      const el = e.currentTarget;
      const body = el.querySelector('.portal-body') ?? el;
      const r = body.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      el.classList.add('is-live');
      el.style.setProperty('--ry', `${((x - 0.5) * max * 2).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${((0.5 - y) * max * 2).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    },
    onPointerLeave(e: PointerEvent<HTMLElement>) {
      const el = e.currentTarget;
      el.classList.remove('is-live');
      for (const p of ['--rx', '--ry', '--mx', '--my']) el.style.removeProperty(p);
    },
  };
}
