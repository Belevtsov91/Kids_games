// Вписываем сцену WORLD в холст любого размера с сохранением пропорций.
import { WORLD, type Vec } from '../game/physics';

export interface View {
  scale: number;
  ox: number;
  oy: number;
}

export const fitView = (width: number, height: number, pad = 12): View => {
  const scale = Math.min((width - pad * 2) / WORLD.w, (height - pad * 2) / WORLD.h);
  return { scale, ox: (width - WORLD.w * scale) / 2, oy: (height - WORLD.h * scale) / 2 };
};

/** Точка экрана (CSS-пиксели холста) → точка сцены. */
export const toWorld = (v: View, x: number, y: number): Vec => ({ x: (x - v.ox) / v.scale, y: (y - v.oy) / v.scale });

/** Звёздное небо: одинаковое при каждой перерисовке благодаря простому генератору. */
export const skyStars = (n: number): { x: number; y: number; r: number }[] => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => ({ x: rnd() * WORLD.w, y: rnd() * WORLD.h, r: 0.6 + rnd() * 1.6 }));
};
