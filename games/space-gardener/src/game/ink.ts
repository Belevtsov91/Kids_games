// Линии-лианы: точки штриха, длина и запас «чернил». Без DOM и физики.

export interface Vec {
  x: number;
  y: number;
}

/** Минимальное расстояние между точками линии: меньше тел в физике, ровнее линия. */
export const MIN_SEGMENT = 14;

export const distance = (a: Vec, b: Vec) => Math.hypot(b.x - a.x, b.y - a.y);

export function strokeLength(points: readonly Vec[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) length += distance(points[i - 1], points[i]);
  return length;
}

/**
 * Добавляет точку к штриху, если она достаточно далеко от последней.
 * Если запаса не хватает на весь отрезок, штрих обрезается ровно по запасу.
 * Возвращает false, когда запас кончился.
 */
export function extendStroke(points: Vec[], p: Vec, budget: number): boolean {
  if (points.length === 0) {
    points.push({ x: p.x, y: p.y });
    return budget > 0;
  }
  const used = strokeLength(points);
  const left = budget - used;
  if (left <= 0.5) return false;
  const last = points[points.length - 1];
  const d = distance(last, p);
  if (d < MIN_SEGMENT) return true;
  if (d <= left) {
    points.push({ x: p.x, y: p.y });
    return true;
  }
  const t = left / d;
  points.push({ x: last.x + (p.x - last.x) * t, y: last.y + (p.y - last.y) * t });
  return false;
}

/** Расстояние от точки до отрезка ab. */
export function distanceToSegment(p: Vec, a: Vec, b: Vec): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}
