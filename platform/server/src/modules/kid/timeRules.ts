// Правила времени ребёнка. Чистые функции без БД: их проверяют тесты, ими пользуются маршруты.

export interface TimeRules {
  /** Минут в день по будням и выходным; null — без ограничения. */
  limitWeekday: number | null;
  limitWeekend: number | null;
  /** «HH:MM»; оба null — тихих часов нет. */
  quietFrom: string | null;
  quietTo: string | null;
  breakEvery: number;
  canAsk: boolean;
}

export const NO_RULES: TimeRules = {
  limitWeekday: null,
  limitWeekend: null,
  quietFrom: null,
  quietTo: null,
  breakEvery: 0,
  canAsk: true,
};

export interface LocalNow {
  /** YYYY-MM-DD в часовом поясе семьи. */
  day: string;
  /** 0 — воскресенье … 6 — суббота. */
  weekday: number;
  /** Минут от полуночи. */
  minutes: number;
}

/** Часовой пояс IANA или UTC, если строка не подходит. */
export function safeZone(tz: string | null | undefined) {
  if (!tz) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

export function localNow(now: Date, tz: string | null | undefined): LocalNow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeZone(tz),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return {
    day: `${get('year')}-${get('month')}-${get('day')}`,
    weekday,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Внутри ли тихих часов. Интервал может идти через полночь (21:00–07:00). */
export function inQuiet(rules: Pick<TimeRules, 'quietFrom' | 'quietTo'>, minutes: number) {
  if (!rules.quietFrom || !rules.quietTo) return false;
  const from = toMinutes(rules.quietFrom), to = toMinutes(rules.quietTo);
  if (from === to) return false;
  return from < to ? minutes >= from && minutes < to : minutes >= from || minutes < to;
}

export const isWeekend = (weekday: number) => weekday === 0 || weekday === 6;

export interface KidTime {
  day: string;
  /** Лимит на сегодня с прибавками; null — без ограничения. */
  limit: number | null;
  usedMinutes: number;
  /** Сколько минут осталось; null — без ограничения. */
  remaining: number | null;
  /** Почему играть нельзя: тихие часы или кончилось время. */
  blocked: 'quiet' | 'limit' | null;
  /** До скольки тихие часы, «HH:MM». */
  quietTo: string | null;
}

export function kidTime(rules: TimeRules, usedSeconds: number, bonusMinutes: number, local: LocalNow): KidTime {
  const base = isWeekend(local.weekday) ? rules.limitWeekend : rules.limitWeekday;
  const limit = base === null ? null : base + bonusMinutes;
  const usedMinutes = Math.floor(usedSeconds / 60);
  const remaining = limit === null ? null : Math.max(0, limit - usedMinutes);
  const quiet = inQuiet(rules, local.minutes);
  return {
    day: local.day,
    limit,
    usedMinutes,
    remaining,
    blocked: quiet ? 'quiet' : remaining === 0 ? 'limit' : null,
    quietTo: quiet ? rules.quietTo : null,
  };
}

/** Сколько секунд засчитать за «пульс»: время с прошлого, но не больше минуты; после долгой паузы — 0. */
export function beatSeconds(lastBeat: Date | null, now: Date) {
  if (!lastBeat) return 0;
  const diff = Math.round((now.getTime() - lastBeat.getTime()) / 1000);
  if (diff <= 0 || diff > 150) return 0;
  return Math.min(diff, 60);
}

/** Последние n дней, от старого к новому: ['2026-10-28', …, сегодня]. */
export function lastDays(today: string, n: number) {
  const base = new Date(`${today}T12:00:00Z`).getTime();
  return Array.from({ length: n }, (_, i) => new Date(base - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10));
}
