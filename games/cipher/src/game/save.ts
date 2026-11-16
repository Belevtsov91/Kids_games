// Сохранение: сколько мешков почты разобрано в каждом режиме и лучшие звёзды.
// Хранится через sdk.storage, поэтому здесь только чистые функции без побочных эффектов.
import { MODES, type Mode } from './rounds';

export interface Save {
  /** Разобрано мешков в режиме — это и есть уровень трудности следующего мешка. */
  bags: Record<Mode, number>;
  /** Лучшее число звёзд за мешок в режиме. */
  best: Record<Mode, number>;
  /** Всего прочитано писем. */
  letters: number;
}

export const SAVE_KEY = 'save';

export const emptySave = (): Save => ({
  bags: { wheel: 0, lighthouse: 0, riddle: 0 },
  best: { wheel: 0, lighthouse: 0, riddle: 0 },
  letters: 0,
});

const count = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0);

/** Приводит сохранение из хранилища (старое, битое, null) к правильной форме. */
export function readSave(raw: unknown): Save {
  const save = emptySave();
  if (!raw || typeof raw !== 'object') return save;
  const data = raw as Partial<Record<keyof Save, unknown>>;
  for (const mode of MODES) {
    save.bags[mode] = count((data.bags as Record<string, unknown> | undefined)?.[mode]);
    save.best[mode] = Math.min(3, count((data.best as Record<string, unknown> | undefined)?.[mode]));
  }
  save.letters = count(data.letters);
  return save;
}

/** Мешок разобран: новый уровень, звёзды и число писем. */
export function finishBag(save: Save, mode: Mode, stars: number, letters: number): Save {
  return {
    bags: { ...save.bags, [mode]: save.bags[mode] + 1 },
    best: { ...save.best, [mode]: Math.max(save.best[mode], stars) },
    letters: save.letters + letters,
  };
}

/** Мешков нужно для наклейки мастера режима. */
export const MASTER_BAGS = 3;

/** Наклейки, которые заслужены этим сохранением (повторная выдача безвредна). */
export function earnedStickers(save: Save): string[] {
  const stickers: string[] = [];
  if (save.letters > 0) stickers.push('first-letter');
  if (save.bags.wheel >= MASTER_BAGS) stickers.push('wheel-master');
  if (save.bags.lighthouse >= MASTER_BAGS) stickers.push('lighthouse-keeper');
  if (save.best.riddle >= 3) stickers.push('riddle-solver');
  if (MODES.every((mode) => save.bags[mode] >= 2)) stickers.push('postmaster');
  return stickers;
}
