// Маяк: полосатая башня с лампой, которая мигает азбукой Морзе.
import { flashesFor } from '../game/morse';
import { h } from './dom';

/** Длина одного «тика» вспышки, мс. */
export const TICK_MS = 260;

export interface Lighthouse {
  el: HTMLElement;
  /** Мигнуть кодом буквы; onDone — после последней вспышки. */
  play(code: string, onBeep: (ms: number) => void, onDone?: () => void): void;
  stop(): void;
}

export function createLighthouse(reduceMotion: boolean): Lighthouse {
  const lamp = h('div', { class: 'cp-lamp' });
  const beam = h('div', { class: 'cp-beam' });
  const el = h('div', { class: 'cp-lighthouse', 'aria-hidden': 'true' }, [
    beam,
    h('div', { class: 'cp-lh-roof' }),
    lamp,
    h('div', { class: 'cp-lh-tower' }, [0, 1, 2, 3].map(() => h('span'))),
  ]);
  let timers: number[] = [];

  const set = (on: boolean) => el.classList.toggle('is-on', on);
  const stop = () => {
    timers.forEach((id) => clearTimeout(id));
    timers = [];
    set(false);
  };

  return {
    el,
    play(code, onBeep, onDone) {
      stop();
      // «Меньше движения»: без мигания — лампа просто светит, код виден текстом.
      if (reduceMotion) {
        set(true);
        timers.push(window.setTimeout(() => (set(false), onDone?.()), 600));
        return;
      }
      let at = 2;
      for (const flash of flashesFor(code)) {
        const start = at * TICK_MS;
        if (flash.on) {
          timers.push(window.setTimeout(() => (set(true), onBeep(flash.ticks * TICK_MS)), start));
          timers.push(window.setTimeout(() => set(false), start + flash.ticks * TICK_MS));
        }
        at += flash.ticks;
      }
      timers.push(window.setTimeout(() => onDone?.(), (at + 1) * TICK_MS));
    },
    stop,
  };
}
