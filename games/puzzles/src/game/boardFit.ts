// Сколько места займёт поле и удобно ли попадать в клетку пальцем. Числа повторяют правила из board.css и responsive.css.
import { gridFor, levelPieces, type Grid, type LevelId } from './puzzleMath';

export interface Viewport {
  width: number;
  height: number;
}

/** Клетка меньше 40 px — ребёнку трудно попадать пальцем, такой уровень на этом экране не предлагаем. */
export const MIN_CELL = 40;
/** От 48 px попадать легко; меньше — подсказываем повернуть телефон, если так клетка станет крупнее. */
export const COMFY_CELL = 48;
/** Больше 16 деталей — «большой пазл»: поле может быть шире (класс is-big). */
export const isBig = (grid: Grid) => grid.cols * grid.rows > 16;

const BORDER = 16;
const SIDE_PADDING = 28;

/** Ширина клетки на поле в пикселях. */
export function cellSize(view: Viewport, aspect: number, grid: Grid): number {
  const big = isBig(grid);
  const landscape = view.width > view.height && view.width >= 640;
  const width = landscape
    ? Math.min(view.width * (big ? 0.64 : 0.6), big ? 760 : 640, (view.height - 150) * aspect)
    : Math.min(view.width - SIDE_PADDING, big ? 760 : 560, (view.height - 330) * aspect);
  return (Math.max(width, 220) - BORDER) / grid.cols;
}

/** Встроенные картинки бывают квадратные и 3:2: уровень доступен, если клетка крупная хотя бы для одной из них.
 * Для конкретной картинки сетку потом подгоняет fitGrid. */
const TYPICAL_PICTURES = [
  { width: 1024, height: 1024 },
  { width: 1536, height: 1024 },
];

export function levelFits(view: Viewport, level: LevelId): boolean {
  const pieces = levelPieces(level);
  if (!pieces) return true;
  return TYPICAL_PICTURES.some(
    (pic) => cellSize(view, pic.width / pic.height, gridFor(pic.width, pic.height, pieces)) >= MIN_CELL,
  );
}

/** Сетка для картинки: если клетки получились мельче MIN_CELL, уменьшаем число деталей, пока не станет удобно. */
export function fitGrid(view: Viewport, width: number, height: number, grid: Grid): Grid {
  let current = grid;
  let target = grid.cols * grid.rows;
  while (target > 4 && cellSize(view, width / height, current) < MIN_CELL) {
    target -= 1;
    current = gridFor(width, height, target);
  }
  return current;
}

/** Повернуть экран стоит, если сейчас клетка мелковата, а после поворота станет заметно крупнее. */
export function betterTurned(view: Viewport, aspect: number, grid: Grid): boolean {
  const now = cellSize(view, aspect, grid);
  const turned = cellSize({ width: view.height, height: view.width }, aspect, grid);
  return now < COMFY_CELL && turned >= now + 4;
}
