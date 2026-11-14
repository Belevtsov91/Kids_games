import { db } from '../../db/index.js';
import { safeZone } from '../kid/timeRules.js';

// Общие помощники чтения для админки: постраничная выборка, «безопасное» чтение таблиц из миграции 008,
// маска почты и дни в часовом поясе владельца.

const PAGE = 1000;
/** Больше стольких строк за один отчёт не читаем: сводка должна оставаться быстрой. */
const MAX_ROWS = 50_000;

type Filter = (q: any) => any; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Все строки запроса: supabase отдаёт не больше 1000 за раз, поэтому читаем страницами. */
export async function allRows<T>(table: string, columns: string, filter: Filter = (q) => q): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await filter(db().from(table).select(columns)).range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

/** Сколько строк подходит под условие (без чтения самих строк). */
export async function countRows(table: string, filter: Filter = (q) => q): Promise<number> {
  const { count, error } = await filter(db().from(table).select('*', { count: 'exact', head: true }));
  if (error) throw error;
  return count ?? 0;
}

/** Таблицы и колонки миграции 008 может ещё не быть: тогда вместо ошибки — запасное значение. */
export async function soft<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch {
    return fallback;
  }
}

/** v***@gmail.com: в списках почта скрыта, целиком показывается по отдельному запросу. */
export function maskEmail(email: string) {
  const at = email.lastIndexOf('@');
  return at < 1 ? '***' : `${email[0]}***${email.slice(at)}`;
}

/** Дата «YYYY-MM-DD» в часовом поясе. */
export function dayIn(tz: string | undefined, at = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: safeZone(tz), year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
}

/** n дней подряд, заканчивая today (включительно), от старых к новым. */
export function daysBack(today: string, n: number) {
  const end = new Date(`${today}T12:00:00Z`).getTime();
  return Array.from({ length: n }, (_, i) => new Date(end - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10));
}

/** Доля изменения в процентах к прошлому периоду; null — сравнивать не с чем. */
export const changePct = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);

export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Сколько раз встречается каждое значение. */
export function tally<T>(items: T[], key: (item: T) => string | null | undefined) {
  const out: Record<string, number> = {};
  for (const item of items) {
    const k = key(item) ?? 'unknown';
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export const ageGroup = (age: number) => (age <= 5 ? '3-5' : age <= 8 ? '6-8' : age <= 12 ? '9-12' : '13-15');
