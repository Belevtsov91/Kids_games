export interface Grid { cols: number; rows: number }

export function recommendedGrid(width: number, height: number): Grid {
  const megapixels = (width * height) / 1_000_000;
  const targetPieces = Math.max(4, Math.min(36, Math.round(6 + megapixels * 8)));
  const aspect = width / height;
  const cols = Math.max(2, Math.min(6, Math.round(Math.sqrt(targetPieces * aspect))));
  const rows = Math.max(2, Math.min(6, Math.round(targetPieces / cols)));
  return { cols, rows };
}

export function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
