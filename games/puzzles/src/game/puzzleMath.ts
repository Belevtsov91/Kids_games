export interface Grid {
  cols: number;
  rows: number;
}

/** Уровни сложности: примерное число деталей. 0 — подобрать по картинке. */
export const LEVELS = [
  { id: 'auto', label: 'Авто', pieces: 0 },
  { id: 'easy', label: '4', pieces: 4 },
  { id: 'medium', label: '9', pieces: 9 },
  { id: 'hard', label: '16', pieces: 16 },
  { id: 'expert', label: '25', pieces: 25 },
] as const;
export type LevelId = (typeof LEVELS)[number]['id'];

/** Сетка под нужное число деталей с учётом пропорций картинки (детали близки к квадрату). */
export function gridFor(width: number, height: number, targetPieces: number): Grid {
  const aspect = width / height;
  const cols = Math.max(2, Math.min(6, Math.round(Math.sqrt(targetPieces * aspect))));
  const rows = Math.max(2, Math.min(6, Math.round(targetPieces / cols)));
  return { cols, rows };
}

export function recommendedGrid(width: number, height: number): Grid {
  const megapixels = (width * height) / 1_000_000;
  return gridFor(width, height, Math.max(4, Math.min(36, Math.round(6 + megapixels * 8))));
}

export function gridForLevel(width: number, height: number, level: LevelId): Grid {
  const pieces = LEVELS.find((item) => item.id === level)?.pieces ?? 0;
  return pieces ? gridFor(width, height, pieces) : recommendedGrid(width, height);
}

export function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Деталь подходит только на своё место: так пазл всегда можно собрать до конца. */
export const fits = (piece: number, cell: number) => piece === cell;

/** Положение фрагмента картинки для детали (CSS background-position в процентах). */
export function piecePosition(piece: number, grid: Grid): string {
  const col = piece % grid.cols;
  const row = Math.floor(piece / grid.cols);
  const x = grid.cols === 1 ? 0 : (col / (grid.cols - 1)) * 100;
  const y = grid.rows === 1 ? 0 : (row / (grid.rows - 1)) * 100;
  return `${x}% ${y}%`;
}
