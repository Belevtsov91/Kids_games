/** Отложенные действия экрана: все снимаются разом при смене экрана или выходе из игры. */
export class Timers {
  private readonly ids = new Set<number>();

  later(fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      this.ids.delete(id);
      fn();
    }, ms);
    this.ids.add(id);
  }

  clear() {
    this.ids.forEach(clearTimeout);
    this.ids.clear();
  }

  /** Перезапускает CSS-анимацию класса и снимает его, когда она отыграла. */
  replayClass(node: HTMLElement, className: string) {
    node.classList.remove(className);
    void node.offsetWidth;
    node.classList.add(className);
    this.later(() => node.classList.remove(className), 700);
  }
}
