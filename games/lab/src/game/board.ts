// Правила доски: куда можно поставить деталь и сколько деталей ещё в запасе.
import { cellX, cellY, COLS, ROWS, type Level, type Shelf } from './levels/types';
import type { PartKind, Placed } from './parts';

/** Расстояние от точки до отрезка полки. */
function distToShelf(x: number, y: number, s: Shelf) {
  const dx = Math.cos(s.angle) * s.half;
  const dy = Math.sin(s.angle) * s.half;
  const ax = s.x - dx;
  const ay = s.y - dy;
  const lx = 2 * dx;
  const ly = 2 * dy;
  const t = Math.max(0, Math.min(1, ((x - ax) * lx + (y - ay) * ly) / (lx * lx + ly * ly || 1)));
  return Math.hypot(x - (ax + lx * t), y - (ay + ly * t));
}

const near = (x: number, y: number, p: { x: number; y: number }, r: number) => Math.hypot(x - p.x, y - p.y) < r;

/** Клетка занята уровнем: полкой, лампой, стартом шарика или готовой деталью. */
export function isBlocked(level: Level, col: number, row: number) {
  const x = cellX(col);
  const y = cellY(row);
  if (level.shelves.some((s) => distToShelf(x, y, s) < 0.5)) return true;
  if (near(x, y, level.bulb, 0.9) || near(x, y, level.ball, 0.9)) return true;
  return (level.fixed ?? []).some((p) => p.col === col && p.row === row);
}

export function canPlace(level: Level, placed: Placed[], col: number, row: number) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return false;
  if (isBlocked(level, col, row)) return false;
  return !placed.some((p) => p.col === col && p.row === row);
}

/** Сколько деталей вида ещё можно поставить. */
export const leftOf = (level: Level, placed: Placed[], kind: PartKind) =>
  (level.inventory[kind] ?? 0) - placed.filter((p) => p.kind === kind).length;

/** Ставит деталь, если можно; иначе возвращает тот же массив. */
export function place(level: Level, placed: Placed[], part: Placed): Placed[] {
  if (leftOf(level, placed, part.kind) <= 0 || !canPlace(level, placed, part.col, part.row)) return placed;
  return [...placed, part];
}

export const removeAt = (placed: Placed[], col: number, row: number) => placed.filter((p) => p.col !== col || p.row !== row);

/** Все детали для симуляции: готовые детали уровня плюс поставленные игроком. */
export const machineOf = (level: Level, placed: Placed[]): Placed[] => [
  ...(level.fixed ?? []).map((p, i) => ({ ...p, id: -1 - i })),
  ...placed,
];
