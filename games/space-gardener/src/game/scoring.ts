// Звёзды за уровень: чем меньше лианы потрачено, тем больше звёзд.

export type Stars = 0 | 1 | 2 | 3;

export function starsFor(inkUsed: number, inkLimit: number): Stars {
  if (inkLimit <= 0) return 3;
  const share = inkUsed / inkLimit;
  if (share <= 0.5) return 3;
  if (share <= 0.8) return 2;
  return 1;
}

/** Уровень открыт, если это первый уровень или предыдущий пройден. */
export function isUnlocked(index: number, starsByIndex: readonly number[]): boolean {
  return index === 0 || (starsByIndex[index - 1] ?? 0) > 0;
}
