// Математика циферблата: время ↔ углы стрелок. Чистые функции, без DOM — их проверяют тесты.

/** Время на циферблате: часы 1–12, минуты 0–59. */
export interface ClockTime {
  h: number;
  m: number;
}

/** Уровни: шаг минутной стрелки. 60 — только ровные часы, 30 — половины, 15 — четверти, 5 — по пять минут. */
export const LEVEL_STEPS = [60, 30, 15, 5] as const;
export type Level = 0 | 1 | 2 | 3;
export const LEVELS: Level[] = [0, 1, 2, 3];

export const stepOf = (level: Level) => LEVEL_STEPS[level];

/** Угол в градусах от 12 часов по часовой стрелке, всегда 0 ≤ a < 360. */
export const norm = (deg: number) => ((deg % 360) + 360) % 360;

/** Углы стрелок. Часовая сдвигается вместе с минутами: в 8:30 она между 8 и 9. */
export function handAngles(t: ClockTime) {
  return { hour: norm((t.h % 12) * 30 + t.m * 0.5), minute: norm(t.m * 6) };
}

/** Минутная стрелка: ближайшее деление с шагом step (на 60 — снова 0). */
export function minuteFromAngle(deg: number, step: number) {
  const m = Math.round(norm(deg) / 6 / step) * step;
  return m >= 60 ? 0 : m;
}

/** Часовая стрелка: ближайший час с учётом того, что минуты уже сдвинули её вперёд. */
export function hourFromAngle(deg: number, minute: number) {
  const h = Math.round(norm(deg - minute * 0.5) / 30) % 12;
  return h === 0 ? 12 : h;
}

/** Угол точки (x, y) относительно центра (cx, cy): 0 — вверх, по часовой. */
export function angleOf(x: number, y: number, cx: number, cy: number) {
  return norm((Math.atan2(x - cx, cy - y) * 180) / Math.PI);
}

export const sameTime = (a: ClockTime, b: ClockTime) => a.h === b.h && a.m === b.m;

/** «8:05», «12:30» — как на электронных часах. */
export const formatTime = (t: ClockTime) => `${t.h}:${String(t.m).padStart(2, '0')}`;

/** 24-часовое время дня → время на циферблате (13 → 1). */
export const toDial = (hour24: number, m: number): ClockTime => ({ h: hour24 % 12 === 0 ? 12 : hour24 % 12, m });

type Rng = () => number;
const pick = <T>(list: readonly T[], rng: Rng) => list[Math.floor(rng() * list.length) % list.length];

/** Минуты, которые встречаются на уровне. На уровне «половины» всегда :30, а не :00 — чтобы было новое. */
export function minutesFor(level: Level): number[] {
  const step = stepOf(level);
  const all = Array.from({ length: 60 / step }, (_, i) => i * step);
  if (level === 0) return all;
  const prev = stepOf((level - 1) as Level);
  // Новые для уровня деления — чаще: :30 на втором, :15/:45 на третьем, «нечётные пятёрки» на четвёртом.
  const fresh = all.filter((m) => m % prev !== 0);
  return [...fresh, ...fresh, ...all];
}

export const randomMinute = (level: Level, rng: Rng) => pick(minutesFor(level), rng);

/**
 * Три варианта ответа для «Который час?»: верный и два похожих —
 * перепутанные стрелки, соседний час, соседнее деление. Все разные.
 */
export function readOptions(target: ClockTime, level: Level, rng: Rng): ClockTime[] {
  const step = stepOf(level);
  const next = (h: number, d: number) => ((h - 1 + d + 12) % 12) + 1;
  const swapped = { h: target.m === 0 ? 12 : target.m / 5, m: (target.h % 12) * 5 };
  const pool: ClockTime[] = [
    { h: next(target.h, 1), m: target.m },
    { h: next(target.h, -1), m: target.m },
    { h: target.h, m: (target.m + step) % 60 },
    { h: target.h, m: (target.m - step + 60) % 60 },
    ...(swapped.m % step === 0 && Number.isInteger(swapped.h) ? [swapped] : []),
  ].filter((t) => !sameTime(t, target));
  const out: ClockTime[] = [target];
  while (out.length < 3 && pool.length) {
    const i = Math.floor(rng() * pool.length) % pool.length;
    const [cand] = pool.splice(i, 1);
    if (!out.some((t) => sameTime(t, cand))) out.push(cand);
  }
  // Перемешиваем, чтобы верный ответ не стоял всегда первым.
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
