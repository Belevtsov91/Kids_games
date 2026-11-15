// Уровни: от «половины с грибами» на готовой нарезке до трёх начинок, где резать надо самому.
// На каждом уровне — три заказа от разных гостей.

export interface Level {
  n: number;
  /** Знаменатели, из которых собираются заказы. */
  dens: number[];
  /** Сколько начинок в заказе. */
  parts: 1 | 2 | 3;
  /** Пицца приходит уже нарезанной: число кусков или 'order' — ровно по знаменателю заказа. */
  cut: number | 'order' | 'free';
  /** Последняя начинка задана словом «остальное». */
  rest?: boolean;
  /** Часть пиццы можно оставить без начинки. */
  plain?: boolean;
}

export const CUTS = [2, 3, 4, 6, 8, 12] as const;
export const ORDERS_PER_LEVEL = 3;

export const LEVELS: Level[] = [
  { n: 1, dens: [2, 4], parts: 1, cut: 'order', plain: true },
  { n: 2, dens: [3, 6], parts: 1, cut: 'order', plain: true },
  { n: 3, dens: [8], parts: 2, cut: 'order', plain: true },
  { n: 4, dens: [2, 4], parts: 1, cut: 8, plain: true },
  { n: 5, dens: [3], parts: 2, cut: 6 },
  { n: 6, dens: [2, 3, 4], parts: 1, cut: 'free', plain: true },
  { n: 7, dens: [2, 4, 8], parts: 2, cut: 'free' },
  { n: 8, dens: [3, 6, 12], parts: 2, cut: 'free', plain: true },
  { n: 9, dens: [3, 4, 6], parts: 2, cut: 'free', rest: true },
  { n: 10, dens: [2, 3, 4, 6, 12], parts: 3, cut: 'free', rest: true },
];

export const levelAt = (n: number) => LEVELS[Math.min(Math.max(n, 1), LEVELS.length) - 1];

/** Уровень, где впервые надо понять, что 1/2 — это 4/8. */
export const EQUIVALENT_LEVEL = 4;
