// Куда ляжет отпущенная деталь. Считаем по координатам, а не по элементу под пальцем: так точнее на мелких клетках.
import type { Grid } from './puzzleMath';

/** Если центр детали ближе ¾ клетки к её месту, деталь встаёт на место, даже если чуть промахнулись. */
export const SNAP_RADIUS = 0.75;
/** Немного за краем поля деталь ещё считается «над полем». */
const OUTSIDE = 0.35;

export interface DropTarget {
  /** Клетка под деталью (или своя клетка, если near). */
  cell: number;
  /** Деталь рядом со своим местом — защёлкнется. */
  near: boolean;
  /** Клетка прямо под центром детали (для подсветки без подсказки). */
  under: number;
}

/** x и y — центр детали в клетках от левого верхнего угла поля (0…cols, 0…rows). */
export function dropTarget(piece: number, x: number, y: number, grid: Grid): DropTarget | null {
  if (x < -OUTSIDE || y < -OUTSIDE || x > grid.cols + OUTSIDE || y > grid.rows + OUTSIDE) return null;
  const col = Math.min(grid.cols - 1, Math.max(0, Math.floor(x)));
  const row = Math.min(grid.rows - 1, Math.max(0, Math.floor(y)));
  const under = row * grid.cols + col;
  const homeX = (piece % grid.cols) + 0.5;
  const homeY = Math.floor(piece / grid.cols) + 0.5;
  const near = Math.hypot(x - homeX, y - homeY) <= SNAP_RADIUS;
  return { cell: near ? piece : under, near, under };
}
