import { el } from './dom';

/** Короткое сообщение внизу сцены: «Сохранили!», «Не получилось…». */
export class Toast {
  readonly el = el('div', { className: 'ao-toast', attrs: { role: 'status' } });
  private timer: ReturnType<typeof setTimeout> | null = null;

  show(text: string) {
    this.el.textContent = text;
    this.el.classList.add('is-shown');
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.el.classList.remove('is-shown'), 1800);
  }

  dispose() {
    if (this.timer) clearTimeout(this.timer);
  }
}
