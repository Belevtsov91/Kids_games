import type { Animal } from '../game/data';

// Как ребёнок берёт зверя: тащит пальцем к дому или касается зверя, а потом дома.
// С клавиатуры: Enter/пробел выбирают зверя, затем Enter на доме.

const DRAG_THRESHOLD = 8;

interface Drag {
  token: HTMLButtonElement;
  animal: Animal;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  over: HTMLElement | null;
}

interface PickerHost {
  /** Корень игры: на нём класс has-selection, пока зверь выбран. */
  root: HTMLElement;
  homeAt(x: number, y: number): HTMLElement | null;
  /** Зверя подняли и потащили. */
  onLift(animal: Animal): void;
  /** Зверя выбрали касанием. */
  onSelect(animal: Animal): void;
  /** Зверя отпустили над домом (или мимо — тогда home = null). */
  onDrop(token: HTMLButtonElement, animal: Animal, home: HTMLElement | null): void;
  /** Перетаскивание сорвалось: зверь возвращается в лоток. */
  onCancel(token: HTMLButtonElement): void;
}

export class AnimalPicker {
  selected: { token: HTMLButtonElement; animal: Animal } | null = null;
  private drag: Drag | null = null;

  constructor(private readonly host: PickerHost) {}

  get dragging() {
    return this.drag !== null;
  }

  attach(token: HTMLButtonElement, animal: Animal) {
    token.addEventListener('pointerdown', (e) => {
      if (this.drag || e.button > 0) return;
      e.preventDefault();
      token.setPointerCapture(e.pointerId);
      this.drag = { token, animal, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, moved: false, over: null };
    });
    token.addEventListener('pointermove', (e) => this.onMove(e));
    token.addEventListener('pointerup', (e) => this.onUp(e));
    token.addEventListener('pointercancel', () => this.cancel());
    token.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      this.select(token, animal);
    });
  }

  cancel() {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    drag.over?.classList.remove('is-over');
    this.host.onCancel(drag.token);
  }

  deselect() {
    this.selected?.token.classList.remove('is-selected');
    this.host.root.classList.remove('has-selection');
    this.selected = null;
  }

  /** Повторное касание того же зверя снимает выбор. */
  private select(token: HTMLButtonElement, animal: Animal) {
    const same = this.selected?.token === token;
    this.deselect();
    if (same) return;
    this.selected = { token, animal };
    token.classList.add('is-selected');
    this.host.root.classList.add('has-selection');
    this.host.onSelect(animal);
  }

  private onMove(e: PointerEvent) {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      this.deselect();
      drag.token.classList.add('is-dragging');
      this.host.onLift(drag.animal);
    }
    drag.token.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
    const over = this.host.homeAt(e.clientX, e.clientY);
    if (over !== drag.over) {
      drag.over?.classList.remove('is-over');
      over?.classList.add('is-over');
      drag.over = over;
    }
  }

  private onUp(e: PointerEvent) {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    this.drag = null;
    drag.over?.classList.remove('is-over');
    // Не сдвинули — значит, это касание: выбираем зверя.
    if (!drag.moved) return this.select(drag.token, drag.animal);
    this.host.onDrop(drag.token, drag.animal, this.host.homeAt(e.clientX, e.clientY));
  }
}
