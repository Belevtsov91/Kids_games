// Касса: заплатить ровно монетами и дать сдачу. Цены и монеты — целые.

export type Rand = () => number;
export const COINS = [1, 2, 5, 10] as const;
export type Coin = (typeof COINS)[number];

export interface Order {
  /** Что покупает покупатель (эмодзи товаров). */
  goods: { art: string; price: number }[];
  total: number;
  /** null — ребёнок платит сам; число — покупатель дал столько, нужна сдача. */
  paid: number | null;
  coins: readonly Coin[];
}

const GOODS = ['🍞', '🥛', '🍌', '🧃', '🍪', '🥚', '🍫', '🧁', '🍦', '🍬'];

export const sum = (coins: readonly number[]) => coins.reduce((a, b) => a + b, 0);

/** Заказ по уровню: 1 — до 5 монетами 1 и 2; 2 — до 10 с пятёркой; 3 — до 20 с десяткой; 4 — сдача с 10. */
export function makeOrder(level: number, rand: Rand): Order {
  const pick = (n: number) => 1 + Math.floor(rand() * n);
  const goodsFor = (total: number) => {
    const first = Math.max(1, Math.min(total - 1, Math.round(total * (0.3 + rand() * 0.4))));
    const parts = total >= 4 ? [first, total - first] : [total];
    return parts.map((price) => ({ art: GOODS[Math.floor(rand() * GOODS.length)], price }));
  };
  if (level >= 4) {
    const total = 2 + pick(7);
    return { goods: goodsFor(total), total, paid: 10, coins: [1, 2, 5] };
  }
  const max = level === 1 ? 5 : level === 2 ? 10 : 20;
  const total = level === 1 ? pick(max) : 3 + pick(max - 3);
  const coins: Coin[] = level === 1 ? [1, 2] : level === 2 ? [1, 2, 5] : [1, 2, 5, 10];
  return { goods: goodsFor(total), total, paid: null, coins };
}

/** Сколько нужно положить: при оплате — цену, при сдаче — разницу. */
export const target = (o: Order) => (o.paid === null ? o.total : o.paid - o.total);

export type PayState = 'less' | 'exact' | 'more';
export const payState = (o: Order, tray: readonly number[]): PayState => {
  const s = sum(tray);
  const t = target(o);
  return s < t ? 'less' : s === t ? 'exact' : 'more';
};
