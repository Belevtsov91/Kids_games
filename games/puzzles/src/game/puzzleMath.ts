export interface Grid {
  cols: number;
  rows: number;
}

/** Уровни сложности: примерное число деталей. 0 — подобрать по картинке. Точное число зависит от формы картинки. */
export const LEVELS = [
  { id: 'auto', icon: '✨', pieces: 0 },
  { id: 'easy', icon: '🐣', pieces: 4 },
  { id: 'medium', icon: '🐰', pieces: 9 },
  { id: 'hard', icon: '🦊', pieces: 16 },
  { id: 'expert', icon: '🐻', pieces: 25 },
  { id: 'master', icon: '🦁', pieces: 36 },
  { id: 'legend', icon: '🐲', pieces: 49 },
] as const;
export type LevelId = (typeof LEVELS)[number]['id'];

/** Самый крупный пазл: 10 столбцов или строк и не больше 54 деталей. */
export const MAX_SIDE = 10;
export const MAX_PIECES = 54;

/**
 * Сетка под нужное число деталей с учётом пропорций картинки.
 * Перебираем все сетки 2…10 и берём ту, где число деталей ближе к нужному, а сами детали ближе к квадрату.
 */
export function gridFor(width: number, height: number, targetPieces: number): Grid {
  let best: Grid = { cols: 2, rows: 2 };
  let bestScore = Infinity;
  for (let rows = 2; rows <= MAX_SIDE; rows += 1) {
    for (let cols = 2; cols <= MAX_SIDE; cols += 1) {
      const count = cols * rows;
      if (count > MAX_PIECES) continue;
      const pieceShape = width / cols / (height / rows);
      const score = 2 * Math.abs(Math.log(count / targetPieces)) + Math.abs(Math.log(pieceShape));
      if (score < bestScore) {
        bestScore = score;
        best = { cols, rows };
      }
    }
  }
  return best;
}

export function recommendedGrid(width: number, height: number): Grid {
  const megapixels = (width * height) / 1_000_000;
  return gridFor(width, height, Math.max(4, Math.min(36, Math.round(6 + megapixels * 8))));
}

export const levelPieces = (level: LevelId) => LEVELS.find((item) => item.id === level)?.pieces ?? 0;

export function gridForLevel(width: number, height: number, level: LevelId): Grid {
  const pieces = levelPieces(level);
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

/** Деталь с края картинки (рамка): с них удобно начинать большой пазл. */
export function isEdge(piece: number, grid: Grid): boolean {
  const col = piece % grid.cols;
  const row = Math.floor(piece / grid.cols);
  return col === 0 || row === 0 || col === grid.cols - 1 || row === grid.rows - 1;
}

/** Положение фрагмента картинки для детали (CSS background-position в процентах). */
export function piecePosition(piece: number, grid: Grid): string {
  const col = piece % grid.cols;
  const row = Math.floor(piece / grid.cols);
  const x = grid.cols === 1 ? 0 : (col / (grid.cols - 1)) * 100;
  const y = grid.rows === 1 ? 0 : (row / (grid.rows - 1)) * 100;
  return `${x}% ${y}%`;
}
