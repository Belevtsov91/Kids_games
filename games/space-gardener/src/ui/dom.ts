// Мелкие помощники для DOM.

export const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Перезапускает CSS-анимацию класса (например, «подпрыгнуть» или «потрясти»). */
export function replayClass(el: HTMLElement, className: string) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

/** Подписки на события, которые снимаются одним вызовом `dispose()`. */
export class Listeners {
  private readonly cleanups: (() => void)[] = [];

  on<K extends keyof HTMLElementEventMap>(
    target: HTMLElement | Window,
    type: K,
    handler: (e: HTMLElementEventMap[K]) => void,
    capture = false,
  ) {
    const fn = handler as EventListener;
    target.addEventListener(type, fn, capture);
    this.cleanups.push(() => target.removeEventListener(type, fn, capture));
  }

  /** Произвольная функция очистки (отписка, disconnect и т.п.). */
  add(cleanup: () => void) {
    this.cleanups.push(cleanup);
  }

  dispose() {
    this.cleanups.forEach((fn) => fn());
    this.cleanups.length = 0;
  }
}
