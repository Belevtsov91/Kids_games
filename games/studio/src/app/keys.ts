import { padByKey } from '../game/kit';

// Клавиатура: 1234 / QWER / ASDF / ZXCV — пэды, пробел — играть/стоп.
// Когда фокус в поле ввода или открыта полка — клавиши не перехватываем.

export interface KeyHandlers {
  pad(pad: number): void;
  play(): void;
  blocked(): boolean;
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export function bindKeys(h: KeyHandlers): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || h.blocked() || isTyping(e.target)) return;
    if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      h.play();
      return;
    }
    const pad = padByKey(e.key);
    if (pad) {
      e.preventDefault();
      h.pad(pad.index);
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
