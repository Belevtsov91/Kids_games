import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

export interface DragState {
  piece: number;
  x: number;
  y: number;
  size: number;
}

/** Порог в пикселях: меньше — это нажатие (выбор детали), больше — перетаскивание. */
const DRAG_THRESHOLD = 8;

/**
 * Перетаскивание детали пальцем, мышью или пером (Pointer Events).
 * Короткое нажатие не мешает: оно остаётся обычным выбором детали.
 * onDrop получает номер клетки под пальцем (data-cell) или null.
 */
export function usePieceDrag(onDrop: (piece: number, cell: number | null) => void, onStart: (piece: number) => void) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const pending = useRef<{ piece: number; x: number; y: number; size: number; id: number } | null>(null);
  const dropRef = useRef(onDrop);
  const startRef = useRef(onStart);
  dropRef.current = onDrop;
  startRef.current = onStart;

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const start = pending.current;
      if (!start || event.pointerId !== start.id) return;
      const far = Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_THRESHOLD;
      setDrag((current) => {
        if (!current && !far) return current;
        if (!current) startRef.current(start.piece);
        return { piece: start.piece, x: event.clientX, y: event.clientY, size: start.size };
      });
    };
    const up = (event: PointerEvent) => {
      const start = pending.current;
      if (!start || event.pointerId !== start.id) return;
      pending.current = null;
      setDrag((current) => {
        if (current) {
          const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-cell]');
          const cell = target ? Number(target.dataset.cell) : null;
          queueMicrotask(() => dropRef.current(current.piece, cell));
        }
        return null;
      });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  const bind = useCallback(
    (piece: number) => (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      const rect = event.currentTarget.getBoundingClientRect();
      pending.current = { piece, x: event.clientX, y: event.clientY, size: rect.width, id: event.pointerId };
      // На тач-экранах браузер сам «захватывает» указатель за элементом — отпускаем, чтобы найти клетку под пальцем.
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [],
  );

  return { drag, bind, dragging: drag !== null };
}
