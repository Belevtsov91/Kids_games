// Управление: клавиатура (WASD/стрелки, пробел, E, F, Q), мышь и пальцы для камеры, колесо для приближения.

import { useEffect, type RefObject } from 'react';
import type { Runtime } from './runtime';

const MOVE_KEYS: Record<string, [number, number]> = {
  KeyW: [0, 1],
  ArrowUp: [0, 1],
  KeyS: [0, -1],
  ArrowDown: [0, -1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

export interface ControlHandlers {
  act(): void;
  cast(): void;
  toggleLog(): void;
  /** Закрыть окно (диалог или журнал); true — что-то закрыли. */
  close(): boolean;
}

export function useControls(runtime: Runtime, scene: RefObject<HTMLElement | null>, enabled: boolean, handlers: ControlHandlers) {
  useEffect(() => {
    if (!enabled) return;
    const keys = runtime.keys;
    const updateMove = () => {
      let x = 0;
      let y = 0;
      for (const code of keys) {
        const move = MOVE_KEYS[code];
        if (move) {
          x += move[0];
          y += move[1];
        }
      }
      runtime.input.moveX = Math.max(-1, Math.min(1, x));
      runtime.input.moveY = Math.max(-1, Math.min(1, y));
      runtime.input.walk = keys.has('ShiftLeft') || keys.has('ShiftRight');
    };
    const down = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.metaKey || event.ctrlKey || event.altKey) return;
      if (MOVE_KEYS[event.code] || event.code.startsWith('Shift')) {
        keys.add(event.code);
        updateMove();
        event.preventDefault();
        return;
      }
      if (event.repeat) return;
      if (event.code === 'Space') {
        runtime.input.jump = true;
        event.preventDefault();
      } else if (event.code === 'KeyE' || event.code === 'Enter') handlers.act();
      else if (event.code === 'KeyF') handlers.cast();
      else if (event.code === 'KeyQ' || event.code === 'KeyJ') handlers.toggleLog();
      else if (event.code === 'Escape' && handlers.close()) event.preventDefault();
    };
    const up = (event: KeyboardEvent) => {
      keys.delete(event.code);
      updateMove();
    };
    const blur = () => {
      keys.clear();
      updateMove();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);

    // Камера: тянуть по сцене мышью или пальцем, колесо — ближе/дальше.
    const element = scene.current;
    let drag: { id: number; x: number; y: number } | null = null;
    const pointerDown = (event: PointerEvent) => {
      if (drag) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    };
    const pointerMove = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;
      runtime.camYaw -= dx * 0.0065;
      runtime.camPitch = Math.max(0.12, Math.min(1.05, runtime.camPitch + dy * 0.004));
    };
    const pointerUp = (event: PointerEvent) => {
      if (drag?.id === event.pointerId) drag = null;
    };
    const wheel = (event: WheelEvent) => {
      runtime.camDist = Math.max(4.5, Math.min(17, runtime.camDist + event.deltaY * 0.01));
      event.preventDefault();
    };
    element?.addEventListener('pointerdown', pointerDown);
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);
    window.addEventListener('pointercancel', pointerUp);
    element?.addEventListener('wheel', wheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      element?.removeEventListener('pointerdown', pointerDown);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerUp);
      window.removeEventListener('pointercancel', pointerUp);
      element?.removeEventListener('wheel', wheel);
      keys.clear();
    };
  }, [runtime, scene, enabled, handlers]);
}
