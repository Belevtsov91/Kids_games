// День Тёпы: распорядок, задания на день, переход между уровнями и наклейки.
import { LEVELS, randomMinute, toDial, type ClockTime, type Level } from './clock';

/** Дела Тёпы по порядку дня. hours — когда это обычно бывает (24 часа). */
export const ROUTINE = [
  { id: 'wake', hours: [7] },
  { id: 'breakfast', hours: [8] },
  { id: 'garden', hours: [9, 10] },
  { id: 'walk', hours: [11] },
  { id: 'lunch', hours: [12, 13] },
  { id: 'nap', hours: [14] },
  { id: 'play', hours: [16, 17] },
  { id: 'dinner', hours: [18, 19] },
  { id: 'bath', hours: [20] },
  { id: 'sleep', hours: [21] },
] as const;
export type EventId = (typeof ROUTINE)[number]['id'];

/** Время суток — от него цвет неба, солнце или луна. */
export type DayPart = 'morning' | 'day' | 'evening' | 'night';
export const dayPartOf = (hour24: number): DayPart =>
  hour24 < 10 ? 'morning' : hour24 < 17 ? 'day' : hour24 < 21 ? 'evening' : 'night';

/** Задание: «который час?» (выбрать ответ) или «поставь стрелки». */
export type TaskKind = 'read' | 'set';
export interface Task {
  event: EventId;
  kind: TaskKind;
  hour24: number;
  time: ClockTime;
}

/** Заданий за день: начало и конец дня всегда, середина — случайные дела по порядку. */
export const TASKS_PER_DAY = 6;

type Rng = () => number;

export function planDay(level: Level, rng: Rng): Task[] {
  const middle = ROUTINE.slice(1, -1).map((e, i) => ({ e, i, r: rng() }));
  const chosen = middle
    .sort((a, b) => a.r - b.r)
    .slice(0, TASKS_PER_DAY - 2)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.e);
  const events = [ROUTINE[0], ...chosen, ROUTINE[ROUTINE.length - 1]];
  return events.map((e, i) => {
    const hour24 = e.hours[Math.floor(rng() * e.hours.length) % e.hours.length];
    // Подъём и сон — ровно в час на первых уровнях, чтобы день начинался с понятного.
    const m = level === 0 || (level === 1 && (e.id === 'wake' || e.id === 'sleep')) ? 0 : randomMinute(level, rng);
    return { event: e.id, kind: i % 2 === 0 ? 'read' : 'set', hour24, time: toDial(hour24, m) };
  });
}

/** Время кончается: оставшиеся задания пропускаем, Тёпа сразу идёт спать. */
export function hurryPlan(plan: Task[], index: number): Task[] {
  const last = plan[plan.length - 1];
  return index >= plan.length - 1 ? plan : [...plan.slice(0, index + 1), last];
}

/** Сколько ошибок за день можно сделать, чтобы открыть следующий уровень. */
export const MAX_MISTAKES_TO_LEVEL_UP = 2;

export function nextUnlocked(unlocked: Level, played: Level, mistakes: number): Level {
  if (played !== unlocked || mistakes > MAX_MISTAKES_TO_LEVEL_UP) return unlocked;
  return Math.min(unlocked + 1, LEVELS[LEVELS.length - 1]) as Level;
}

/** Наклейка за каждый уровень: выдаётся, когда день на этом уровне пройден. */
export const LEVEL_STICKERS = ['hours', 'half-past', 'quarters', 'five-minutes'] as const;

/**
 * Наклейки за законченный день. days — сколько дней было до этого,
 * mistakes — ошибки за день, level — уровень дня.
 */
export function stickersFor(days: number, level: Level, mistakes: number): string[] {
  const out: string[] = [];
  if (days === 0) out.push('first-day');
  out.push(LEVEL_STICKERS[level]);
  if (mistakes === 0) out.push('no-mistakes');
  if (days + 1 === 7) out.push('seven-days');
  return out;
}
