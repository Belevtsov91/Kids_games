// Прогресс: звёзды за уровни. Звёзды зависят только от числа попыток — без спешки и без сравнения с другими.

export interface Progress {
  /** Звёзды по номеру уровня (1–3). */
  stars: Record<number, number>;
}

export const emptyProgress = (): Progress => ({ stars: {} });

export const starsFor = (attempts: number) => (attempts <= 1 ? 3 : attempts <= 3 ? 2 : 1);

/** Открыт ли уровень: первый всегда, дальше — после прохождения предыдущего. */
export const isUnlocked = (p: Progress, n: number) => n === 1 || (p.stars[n - 1] ?? 0) > 0;

/** Запоминаем лучший результат. */
export function recordWin(p: Progress, n: number, attempts: number): Progress {
  const stars = Math.max(p.stars[n] ?? 0, starsFor(attempts));
  return { stars: { ...p.stars, [n]: stars } };
}

/** Проверка сохранённого значения: битое — начинаем заново. */
export function readProgress(raw: unknown): Progress {
  const stars = (raw as Progress | null)?.stars;
  if (!stars || typeof stars !== 'object') return emptyProgress();
  const clean: Record<number, number> = {};
  for (const [k, v] of Object.entries(stars)) if (Number(k) > 0 && [1, 2, 3].includes(v as number)) clean[Number(k)] = v as number;
  return { stars: clean };
}
