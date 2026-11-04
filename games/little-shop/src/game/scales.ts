// Весы: какой товар тяжелее и уравновесить товар гирьками. Вес — в условных «кило».
import type { Rand } from './money';

export interface Item {
  id: string;
  art: string;
  weight: number;
}

export const ITEMS: readonly Item[] = [
  { id: 'strawberry', art: '🍓', weight: 1 },
  { id: 'lemon', art: '🍋', weight: 2 },
  { id: 'carrot', art: '🥕', weight: 2 },
  { id: 'apple', art: '🍎', weight: 3 },
  { id: 'potato', art: '🥔', weight: 4 },
  { id: 'cheese', art: '🧀', weight: 5 },
  { id: 'pineapple', art: '🍍', weight: 6 },
  { id: 'melon', art: '🍈', weight: 7 },
  { id: 'watermelon', art: '🍉', weight: 9 },
  { id: 'pumpkin', art: '🎃', weight: 10 },
];

export const WEIGHTS = [1, 2, 5] as const;

/** Пара разного веса для «что тяжелее»; на уровне 1 разница большая, дальше — меньше. */
export function comparePair(level: number, rand: Rand): [Item, Item] {
  const minGap = level <= 1 ? 4 : level === 2 ? 2 : 1;
  const pairs: [Item, Item][] = [];
  for (const a of ITEMS) for (const b of ITEMS) if (b.weight - a.weight >= minGap && (level > 2 || b.weight - a.weight <= 6)) pairs.push([a, b]);
  const pair = pairs[Math.floor(rand() * pairs.length)];
  return rand() < 0.5 ? pair : [pair[1], pair[0]];
}

/** Товар для уравновешивания: уровень 1 — до 4 кг (гирьки 1 и 2), дальше — тяжелее, с гирькой 5. */
export function balanceItem(level: number, rand: Rand): Item {
  const max = level <= 1 ? 4 : level === 2 ? 7 : 10;
  const pool = ITEMS.filter((i) => i.weight >= 2 && i.weight <= max);
  return pool[Math.floor(rand() * pool.length)];
}

/** Наклон весов: −1 (левая тяжелее) … 1 (правая тяжелее), плавно. */
export const tilt = (left: number, right: number) => Math.max(-1, Math.min(1, (right - left) / 4));
