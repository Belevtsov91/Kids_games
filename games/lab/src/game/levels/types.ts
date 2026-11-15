import type { PartKind, Placed } from '../parts';

/** Доска: COLS × ROWS клеток по 1 метру. Клетка (0, 0) — левая нижняя, пол острова на y = 0. */
export const COLS = 14;
export const ROWS = 9;

export const cellX = (col: number) => col - COLS / 2 + 0.5;
export const cellY = (row: number) => row + 0.5;

/** Неподвижная полка уровня: центр, половина длины, наклон в радианах. */
export interface Shelf {
  x: number;
  y: number;
  half: number;
  angle: number;
}

export interface Level {
  id: string;
  /** Шарик стартует отсюда; vx — лёгкий толчок, чтобы покатился. */
  ball: { x: number; y: number; vx: number };
  bulb: { x: number; y: number };
  /** Звёздочка по пути: пролети через неё за дополнительную звезду. */
  star: { x: number; y: number };
  shelves: Shelf[];
  /** Готовые детали уровня, их нельзя двигать. */
  fixed?: Omit<Placed, 'id'>[];
  /** Сколько каких деталей у игрока. */
  inventory: Partial<Record<PartKind, number>>;
  /** Звезда за экономию: зажги лампу, поставив не больше стольких деталей. */
  par: number;
  /** Проверенное решение: им подсказывает Тёпа и его прогоняет тест. */
  solution: Omit<Placed, 'id'>[];
}
