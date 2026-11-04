// Геометрия карты: детерминированный генератор случайных чисел, расстояния, «рядом с дорожкой», поиск ближайшего.

import { PATHS, type Vec2 } from './map';

/** Детерминированный генератор: одинаковый лес при каждом запуске. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const dist = (a: Vec2, b: Vec2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function nearPath(p: Vec2, width: number) {
  for (const path of PATHS)
    for (let i = 0; i < path.length - 1; i++) {
      const [a, b] = [path[i], path[i + 1]];
      const [dx, dz] = [b[0] - a[0], b[1] - a[1]];
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)));
      if (dist(p, [a[0] + dx * t, a[1] + dz * t]) < width) return true;
    }
  return false;
}

/** Ближайшая точка из списка в пределах radius или null. */
export function nearest<T>(items: T[], at: (item: T) => Vec2, p: Vec2, radius: number): T | null {
  let best: T | null = null;
  let bestD = radius;
  for (const item of items) {
    const d = dist(at(item), p);
    if (d < bestD) {
      best = item;
      bestD = d;
    }
  }
  return best;
}
