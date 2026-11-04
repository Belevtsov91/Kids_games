// Сок до отметки: наливаем, пока держат кнопку, и смотрим, насколько близко к линии.

export const POUR_PER_SEC = 0.22;

/** Отметка на стакане: на уровне 1 — круглые доли (половина, четверть), дальше — любые. */
export function juiceTarget(level: number, rand: () => number): number {
  if (level <= 1) return [0.5, 0.75, 0.25][Math.floor(rand() * 3)];
  return Math.round((0.25 + rand() * 0.6) * 100) / 100;
}

/** Допуск попадания: чем выше уровень, тем точнее. */
export const tolerance = (level: number) => (level <= 1 ? 0.08 : level === 2 ? 0.055 : 0.035);

export type PourResult = 'ok' | 'less' | 'more';
export function judge(level: number, target: number, amount: number): PourResult {
  const d = amount - target;
  if (Math.abs(d) <= tolerance(level)) return 'ok';
  return d < 0 ? 'less' : 'more';
}

export const pour = (amount: number, dtMs: number) => Math.min(1, amount + (POUR_PER_SEC * dtMs) / 1000);
