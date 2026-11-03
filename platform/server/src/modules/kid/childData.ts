import { db } from '../../db/index.js';
import { kidTime, lastDays, localNow, NO_RULES, type KidTime, type TimeRules } from './timeRules.js';

// Чтение настроек и времени ребёнка из БД. Общие для страниц ребёнка и кабинета родителя.

export interface SettingsRow {
  lang: string | null;
  photo: string | null;
  limit_weekday: number | null;
  limit_weekend: number | null;
  quiet_from: string | null;
  quiet_to: string | null;
  break_every: number;
  can_ask: boolean;
  last_beat_at: string | null;
}

const SETTINGS_COLUMNS = 'lang, photo, limit_weekday, limit_weekend, quiet_from, quiet_to, break_every, can_ask, last_beat_at';

export const rulesOf = (row: SettingsRow | null): TimeRules =>
  row
    ? {
        limitWeekday: row.limit_weekday,
        limitWeekend: row.limit_weekend,
        quietFrom: row.quiet_from?.slice(0, 5) ?? null,
        quietTo: row.quiet_to?.slice(0, 5) ?? null,
        breakEvery: row.break_every,
        canAsk: row.can_ask,
      }
    : NO_RULES;

export async function settingsOf(childId: string): Promise<SettingsRow | null> {
  const { data, error } = await db().from('ig_child_settings').select(SETTINGS_COLUMNS).eq('child_id', childId).maybeSingle();
  if (error) throw error;
  return data as SettingsRow | null;
}

/** Часовой пояс семьи: из настроек родителя, иначе тот, что прислал браузер. */
export async function zoneOf(parentId: string, fallback?: string) {
  const { data, error } = await db().from('ig_parent_settings').select('timezone').eq('parent_id', parentId).maybeSingle();
  if (error) throw error;
  return data?.timezone ?? fallback ?? 'UTC';
}

export async function usedSeconds(childId: string, day: string) {
  const { data, error } = await db().from('ig_play_daily').select('seconds').eq('child_id', childId).eq('day', day);
  if (error) throw error;
  return (data ?? []).reduce((sum, r) => sum + r.seconds, 0);
}

export async function bonusMinutes(childId: string, day: string) {
  const { data, error } = await db()
    .from('ig_time_requests')
    .select('minutes')
    .eq('child_id', childId)
    .eq('day', day)
    .eq('status', 'approved');
  if (error) throw error;
  return (data ?? []).reduce((sum, r) => sum + r.minutes, 0);
}

/** Время ребёнка на сейчас: лимит, сколько осталось, тихие часы. */
export async function timeOf(childId: string, settings: SettingsRow | null, zone: string, now = new Date()): Promise<KidTime> {
  const local = localNow(now, zone);
  const [used, bonus] = await Promise.all([usedSeconds(childId, local.day), bonusMinutes(childId, local.day)]);
  return kidTime(rulesOf(settings), used, bonus, local);
}

/** Ручные «можно/нельзя» по играм: { 'moon-valley': true }. */
export async function accessOf(childId: string): Promise<Record<string, boolean>> {
  const { data, error } = await db().from('ig_child_game_access').select('game_id, allowed').eq('child_id', childId);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.game_id, r.allowed]));
}

export interface Stats {
  /** Минуты по дням, от старого к новому. */
  days: { day: string; minutes: number }[];
  /** Игры за период: минуты и последний день. */
  games: { gameId: string; minutes: number; lastDay: string }[];
}

export async function statsOf(childId: string, zone: string, n: number, now = new Date()): Promise<Stats> {
  const days = lastDays(localNow(now, zone).day, n);
  const { data, error } = await db()
    .from('ig_play_daily')
    .select('day, game_id, seconds')
    .eq('child_id', childId)
    .gte('day', days[0]);
  if (error) throw error;
  const perDay = new Map(days.map((d) => [d, 0]));
  const perGame = new Map<string, { seconds: number; lastDay: string }>();
  for (const row of data ?? []) {
    perDay.set(row.day, (perDay.get(row.day) ?? 0) + row.seconds);
    const g = perGame.get(row.game_id) ?? { seconds: 0, lastDay: row.day };
    g.seconds += row.seconds;
    if (row.day > g.lastDay) g.lastDay = row.day;
    perGame.set(row.game_id, g);
  }
  return {
    days: days.map((day) => ({ day, minutes: Math.round((perDay.get(day) ?? 0) / 60) })),
    games: [...perGame]
      .map(([gameId, g]) => ({ gameId, minutes: Math.round(g.seconds / 60), lastDay: g.lastDay }))
      .sort((a, b) => b.minutes - a.minutes),
  };
}
