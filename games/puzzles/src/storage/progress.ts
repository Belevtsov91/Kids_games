// Недособранный большой пазл: какие детали уже на поле. Хранится через sdk.storage отдельно для профиля и картинки.
import type { GameStorage } from '@ig/sdk';
import type { Grid } from '../game/puzzleMath';

/** Маленькие пазлы собираются за минуту — сохраняем только от 25 деталей. */
export const SAVE_FROM = 25;

export interface Progress {
  grid: Grid;
  /** Номера деталей, которые уже стоят на своих местах. */
  placed: number[];
}

const key = (profileId: string | null, puzzleId: string) => `progress:${profileId ?? 'guest'}:${puzzleId}`;

function valid(value: unknown): value is Progress {
  const item = value as Progress | null;
  return (
    !!item &&
    Number.isInteger(item.grid?.cols) &&
    Number.isInteger(item.grid?.rows) &&
    Array.isArray(item.placed) &&
    item.placed.every((piece) => Number.isInteger(piece) && piece >= 0 && piece < item.grid.cols * item.grid.rows)
  );
}

export function loadProgress(storage: GameStorage, profileId: string | null, puzzleId: string): Progress | null {
  const value = storage.load<unknown>(key(profileId, puzzleId));
  return valid(value) && value.placed.length > 0 ? value : null;
}

/** null — стереть (пазл собран или начат заново). */
export function saveProgress(storage: GameStorage, profileId: string | null, puzzleId: string, progress: Progress | null) {
  try {
    storage.save(key(profileId, puzzleId), progress);
  } catch {
    // Хранилище переполнено или недоступно — пазл просто не продолжится в следующий раз.
  }
}
