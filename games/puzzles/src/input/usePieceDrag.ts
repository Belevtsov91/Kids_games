import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import type { Grid } from '../game/puzzleMath';
import { dropTarget, type DropTarget } from '../game/snap';

/** Порог в пикселях: меньше — это нажатие (выбор детали), больше — перетаскивание. */
const DRAG_THRESHOLD = 8;
/** На тач-экране деталь едет выше пальца, чтобы ребёнок видел, куда кладёт. */
const FINGER_GAP = 16;

interface Options {
  boardRef: RefObject<HTMLElement | null>;
  grid: Grid;
  /** С подсказкой своё место подсвечивается, когда деталь рядом. */
  hint: boolean;
  onStart: (piece: number) => void;
  /** cell — клетка, куда кладём (своя, если деталь была рядом), или null — отпустили мимо поля. */
  onDrop: (piece: number, cell: number | null) => void;
}

interface Pending {
  piece: number;
  id: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  size: number;
  touch: boolean;
  active: boolean;
  target: DropTarget | null;
}

/** Поле без рамки в координатах экрана. */
function boardBox(board: HTMLElement) {
  const rect = board.getBoundingClientRect();
  const border = parseFloat(getComputedStyle(board).borderLeftWidth) || 0;
  return { left: rect.left + border, top: rect.top + border, width: rect.width - 2 * border, height: rect.height - 2 * border };
}

/**
 * Перетаскивание детали пальцем, мышью или пером (Pointer Events).
 * Пока деталь едет, React не перерисовывается: «призрак» двигаем напрямую через ghostRef.
 */
export function usePieceDrag(options: Options) {
  const [dragPiece, setDragPiece] = useState<number | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const pending = useRef<Pending | null>(null);
  const marked = useRef<HTMLElement | null>(null);
  const opts = useRef(options);
  opts.current = options;

  const mark = (cell: HTMLElement | null, kind: 'near' | 'over' | null) => {
    if (marked.current && marked.current !== cell) delete marked.current.dataset.drop;
    if (cell && kind) cell.dataset.drop = kind;
    else if (cell) delete cell.dataset.drop;
    marked.current = cell;
  };

  const position = useCallback((drag: Pending) => {
    const board = opts.current.boardRef.current;
    const { grid, hint } = opts.current;
    const box = board ? boardBox(board) : null;
    const cellW = box ? box.width / grid.cols : drag.size;
    const cellH = box ? box.height / grid.rows : drag.size;
    const over =
      !!box && drag.x > box.left - cellW && drag.x < box.left + box.width + cellW && drag.y > box.top - cellH && drag.y < box.top + box.height + 2 * cellH;
    const width = over ? cellW : drag.size * 1.12;
    const height = over ? cellH : (drag.size * 1.12 * cellH) / cellW;
    const centerX = drag.x;
    const centerY = drag.touch ? drag.y - height / 2 - FINGER_GAP : drag.y;
    const ghost = ghostRef.current;
    if (ghost) {
      ghost.style.width = `${width}px`;
      ghost.style.height = `${height}px`;
      ghost.style.transform = `translate(${centerX - width / 2}px, ${centerY - height / 2}px)`;
    }
    drag.target = box ? dropTarget(drag.piece, (centerX - box.left) / cellW, (centerY - box.top) / cellH, grid) : null;
    const target = drag.target;
    if (!board || !target) return mark(null, null);
    const showHome = target.near && hint;
    const cell = board.querySelector<HTMLElement>(`[data-cell="${showHome ? target.cell : target.under}"]`);
    mark(cell, showHome ? 'near' : 'over');
  }, []);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = pending.current;
      if (!drag || event.pointerId !== drag.id) return;
      drag.x = event.clientX;
      drag.y = event.clientY;
      if (!drag.active) {
        if (Math.hypot(drag.x - drag.startX, drag.y - drag.startY) <= DRAG_THRESHOLD) return;
        drag.active = true;
        setDragPiece(drag.piece);
        opts.current.onStart(drag.piece);
      }
      position(drag);
    };
    const up = (event: PointerEvent) => {
      const drag = pending.current;
      if (!drag || event.pointerId !== drag.id) return;
      pending.current = null;
      if (!drag.active) return;
      mark(null, null);
      setDragPiece(null);
      const cell = event.type === 'pointercancel' ? null : (drag.target?.cell ?? null);
      queueMicrotask(() => opts.current.onDrop(drag.piece, cell));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [position]);

  // «Призрак» появляется после перерисовки — ставим его под палец сразу, не дожидаясь следующего движения.
  useLayoutEffect(() => {
    if (dragPiece !== null && pending.current?.active) position(pending.current);
  }, [dragPiece, position]);

  const bind = useCallback(
    (piece: number) => (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const { clientX: x, clientY: y } = event;
      pending.current = { piece, id: event.pointerId, startX: x, startY: y, x, y, size: rect.width, touch: event.pointerType !== 'mouse', active: false, target: null };
      // На тач-экранах браузер сам «захватывает» указатель за элементом — отпускаем, чтобы следить за пальцем по всему окну.
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [],
  );

  return { dragPiece, bind, ghostRef };
}
