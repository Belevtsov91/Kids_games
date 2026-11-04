// Мелочи DOM: создать элемент, перетаскивание с «магнитом» и выбором касанием, подсказка-ручка.

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html) node.innerHTML = html;
  return node;
}

const center = (node: Element) => {
  const r = node.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: Math.max(r.width, r.height) / 2 };
};

export interface DragOptions<T> {
  item: HTMLElement;
  targets: () => { node: HTMLElement; value: T }[];
  /** Положили на цель: true — принято (предмет остаётся там), false — вернуть назад. */
  onDrop: (value: T) => boolean;
  onPick?: () => void;
  /** Насколько близко к цели считается «попал», в долях её радиуса. */
  magnet?: number;
  /** Цель одна (тарелка): простое касание сразу отправляет предмет туда. */
  tapTo?: T;
}

/**
 * Перетаскивание пальцем. Для малышей есть и второй способ: нажать на предмет (он подсветится),
 * а потом нажать на цель. Возвращает функцию отключения.
 */
export function draggable<T>(opts: DragOptions<T>): () => void {
  const { item } = opts;
  let start: { x: number; y: number } | null = null;
  let moved = false;

  const reset = () => {
    item.style.transform = '';
    item.classList.remove('is-dragging');
  };
  const bounce = () => {
    item.classList.add('is-back');
    setTimeout(() => item.classList.remove('is-back'), 400);
  };
  const nearest = (x: number, y: number) => {
    let best: { value: T; d: number } | null = null;
    for (const t of opts.targets()) {
      const c = center(t.node);
      const d = Math.hypot(c.x - x, c.y - y) / c.r;
      if (d < (opts.magnet ?? 1.3) && (!best || d < best.d)) best = { value: t.value, d };
    }
    return best;
  };

  const down = (e: PointerEvent) => {
    if (item.classList.contains('is-placed')) return;
    start = { x: e.clientX, y: e.clientY };
    moved = false;
    item.setPointerCapture(e.pointerId);
    opts.onPick?.();
  };
  const move = (e: PointerEvent) => {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!moved && Math.hypot(dx, dy) < 8) return;
    moved = true;
    item.classList.add('is-dragging');
    item.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
  };
  const up = (e: PointerEvent) => {
    if (!start) return;
    start = null;
    if (!moved && opts.tapTo !== undefined) {
      if (opts.onDrop(opts.tapTo)) item.classList.add('is-placed');
      else bounce();
      return;
    }
    if (!moved) {
      // Касание без движения: выбираем предмет, цель — следующим касанием.
      document.querySelectorAll('.sb-item.is-selected').forEach((n) => n !== item && n.classList.remove('is-selected'));
      item.classList.toggle('is-selected');
      return;
    }
    const hit = nearest(e.clientX, e.clientY);
    const ok = Boolean(hit && opts.onDrop(hit.value));
    item.classList.remove('is-dragging');
    if (ok) return void item.classList.add('is-placed');
    reset();
    bounce();
  };

  const tapTarget = (value: T) => (e: Event) => {
    if (!item.classList.contains('is-selected')) return;
    e.stopPropagation();
    item.classList.remove('is-selected');
    if (opts.onDrop(value)) item.classList.add('is-placed');
    else bounce();
  };
  const targetHandlers = opts.targets().map((t) => {
    const handler = tapTarget(t.value);
    t.node.addEventListener('click', handler);
    return () => t.node.removeEventListener('click', handler);
  });

  item.addEventListener('pointerdown', down);
  item.addEventListener('pointermove', move);
  item.addEventListener('pointerup', up);
  item.addEventListener('pointercancel', () => ((start = null), reset()));
  return () => {
    item.removeEventListener('pointerdown', down);
    item.removeEventListener('pointermove', move);
    item.removeEventListener('pointerup', up);
    targetHandlers.forEach((off) => off());
  };
}

/** Ручка-подсказка над элементом: малыш видит, куда нажать. */
export function showHint(root: HTMLElement, target: Element | null) {
  root.querySelector('.sb-hint')?.remove();
  if (!target) return;
  const box = root.getBoundingClientRect();
  const c = target.getBoundingClientRect();
  const hand = el('div', 'sb-hint', '👆');
  hand.style.left = `${c.left - box.left + c.width / 2}px`;
  hand.style.top = `${c.top - box.top + c.height * 0.6}px`;
  root.appendChild(hand);
}
