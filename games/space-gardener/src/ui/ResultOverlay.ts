// Слой поверх поля для карточки результата. Карточка показывается с задержкой (сначала цветок распускается).

export class ResultOverlay {
  readonly el = document.createElement('div');
  private timer = 0;

  constructor() {
    this.el.className = 'sg-overlay';
    this.el.hidden = true;
  }

  get isOpen() {
    return this.el.hidden !== true;
  }

  /** Показать карточку через `delayMs`; `afterShow` — звуки и анимация, когда она появилась. */
  showLater(delayMs: number, html: string | (() => string), afterShow?: (card: HTMLElement) => void) {
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.el.innerHTML = typeof html === 'function' ? html() : html;
      this.el.hidden = false;
      this.el.querySelector<HTMLButtonElement>('.sg-green')?.focus({ preventScroll: true });
      afterShow?.(this.el);
    }, delayMs);
  }

  /** Спрятать карточку и отменить запланированную. */
  hide() {
    clearTimeout(this.timer);
    this.el.hidden = true;
  }
}
