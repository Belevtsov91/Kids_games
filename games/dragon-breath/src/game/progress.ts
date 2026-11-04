// Прогресс: сколько спокойных минуток провёл ребёнок. Каждые три открывают новый цвет дракончика.

export const SCENES = ['balloon', 'candles', 'dandelion'] as const;
export type Scene = (typeof SCENES)[number];

/** Оттенки дракончика (поворот цвета в градусах). Первый — родной зелёный. */
export const COLORS = [0, 140, 200, 280, 320, 40] as const;
export const SESSIONS_PER_COLOR = 3;

export interface Progress {
  sessions: number;
  color: number;
}

export const emptyProgress = (): Progress => ({ sessions: 0, color: 0 });

export const unlockedColors = (p: Progress) => Math.min(COLORS.length, 1 + Math.floor(p.sessions / SESSIONS_PER_COLOR));

export function finishSession(p: Progress): { progress: Progress; newColor: boolean } {
  const before = unlockedColors(p);
  const progress = { ...p, sessions: p.sessions + 1 };
  return { progress, newColor: unlockedColors(progress) > before };
}

export function readProgress(raw: unknown): Progress {
  const r = raw as Partial<Progress> | null;
  const sessions = Math.max(0, Math.floor(Number(r?.sessions) || 0));
  const p = { sessions, color: 0 };
  const color = Math.floor(Number(r?.color) || 0);
  return { ...p, color: color >= 0 && color < unlockedColors(p) ? color : 0 };
}
