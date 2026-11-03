// Перетаскивание фигуры пальцем или мышью: призрак едет за указателем, при отпускании — точка в координатах доски.
// Короткое касание без движения считается нажатием (выбор фигуры).

export interface DragHandlers {
  /** Призрак — то, что едет за пальцем. */
  ghost(): HTMLElement | SVGElement;
  tap(): void;
  drop(clientX: number, clientY: number): void;
  start?(): void;
}

const TAP_PX = 8;

export function makeDraggable(source: HTMLElement, h: DragHandlers): () => void {
  const onDown = (e: PointerEvent) => {
    if (e.button > 0) return;
    e.preventDefault();
    const x0 = e.clientX;
    const y0 = e.clientY;
    let ghost: HTMLElement | SVGElement | null = null;
    const move = (ev: PointerEvent) => {
      if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) > TAP_PX) {
        ghost = h.ghost();
        ghost.classList.add('sw-ghost');
        document.body.append(ghost);
        h.start?.();
      }
      if (ghost) ghost.style.transform = `translate(${ev.clientX}px, ${ev.clientY}px) translate(-50%, -50%)`;
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!ghost) return h.tap();
      ghost.remove();
      if (ev.type === 'pointerup') h.drop(ev.clientX, ev.clientY);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  source.addEventListener('pointerdown', onDown);
  return () => source.removeEventListener('pointerdown', onDown);
}

/** Точка экрана → координаты 0…100 внутри SVG-доски. */
export function toBoard(svg: SVGSVGElement, clientX: number, clientY: number) {
  const r = svg.getBoundingClientRect();
  return { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100, inside: clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom };
}
