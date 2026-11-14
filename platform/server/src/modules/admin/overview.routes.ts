import type { FastifyPluginAsync } from 'fastify';
import type { GameManifest } from '@ig/sdk/manifest';
import { effectiveAge } from '../children/childView.js';
import { ageGroup, allRows, changePct, countRows, dayIn, daysBack, soft, sum, tally } from './data.js';

// Главная админки: цифры за период, сравнение с прошлым периодом, графики по дням и разбивки.
// Считаем на сервере из обычных таблиц; семей сотни, поэтому хватает чтения строк и подсчёта в коде.

const query = {
  type: 'object',
  properties: { days: { type: 'integer', enum: [1, 7, 30, 365] }, tz: { type: 'string', maxLength: 64 } },
} as const;

/** «Играет сейчас»: пульс игры был не раньше двух минут назад (оболочка шлёт его раз в минуту). */
const NOW_MS = 2 * 60_000;

interface Play { child_id: string; day: string; game_id: string; seconds: number }
interface Kid { id: string; age: number; deleted_at: string | null }
interface KidExtra { child_id: string; birth_month: string | null; last_beat_at: string | null; last_game?: string | null; lang: string | null }

export const overviewRoutes: FastifyPluginAsync<{ catalog: GameManifest[] }> = async (app, opts) => {
  const titleOf = (id: string) => opts.catalog.find((g) => g.id === id)?.title ?? id;

  app.get<{ Querystring: { days?: number; tz?: string } }>('/overview', { schema: { querystring: query } }, async (req) => {
    const days = req.query.days ?? 7;
    const now = new Date();
    const today = dayIn(req.query.tz, now);
    const period = daysBack(today, days);
    const both = daysBack(today, days * 2);
    const previous = both.slice(0, days);
    const sinceIso = new Date(now.getTime() - days * 2 * 86_400_000).toISOString();
    const dayAgo = new Date(now.getTime() - 86_400_000).toISOString();

    const [parents, kids, extra, plays, locales, pending, errors, mails, devices] = await Promise.all([
      allRows<{ id: string; created_at: string }>('ig_parents', 'id, created_at'),
      allRows<Kid>('ig_children', 'id, age, deleted_at'),
      // Колонки last_game может ещё не быть (миграция 008 не накатана) — тогда читаем без неё.
      soft<KidExtra[] | null>(() => allRows<KidExtra>('ig_child_settings', 'child_id, birth_month, last_beat_at, last_game, lang'), null).then(
        (rows) => rows ?? allRows<KidExtra>('ig_child_settings', 'child_id, birth_month, last_beat_at, lang'),
      ),
      allRows<Play>('ig_play_daily', 'child_id, day, game_id, seconds', (q) => q.gte('day', both[0])),
      allRows<{ mail_locale: string | null }>('ig_parent_settings', 'mail_locale'),
      countRows('ig_time_requests', (q) => q.eq('status', 'pending').gte('created_at', dayAgo)),
      soft(() => allRows<{ first_at: string }>('ig_error_log', 'first_at', (q) => q.gte('last_at', dayAgo)), []),
      soft(() => allRows<{ ok: boolean }>('ig_mail_log', 'ok', (q) => q.gte('created_at', dayAgo)), []),
      soft(() => allRows<{ device: string | null }>('ig_sessions', 'device', (q) => q.gt('expires_at', now.toISOString())), []),
    ]);

    const live = kids.filter((k) => !k.deleted_at);
    const extraOf = new Map(extra.map((e) => [e.child_id, e]));
    const inPeriod = new Set(period);
    const minutes = (rows: Play[]) => Math.round(sum(rows.map((r) => r.seconds)) / 60);
    const playsNow = plays.filter((p) => inPeriod.has(p.day));
    const playsBefore = plays.filter((p) => previous.includes(p.day));
    const createdDay = (iso: string) => dayIn(req.query.tz, new Date(iso));
    const newNow = parents.filter((p) => inPeriod.has(createdDay(p.created_at)));
    const newBefore = parents.filter((p) => p.created_at >= sinceIso && previous.includes(createdDay(p.created_at)));
    const todayPlays = plays.filter((p) => p.day === today);
    const yesterdayPlays = plays.filter((p) => p.day === both[both.length - 2]);
    const active = (rows: Play[]) => new Set(rows.map((r) => r.child_id)).size;

    const playing = extra.filter((e) => e.last_beat_at && now.getTime() - new Date(e.last_beat_at).getTime() < NOW_MS);
    const byGame = (rows: Play[]) => {
      const out: Record<string, number> = {};
      for (const r of rows) out[r.game_id] = (out[r.game_id] ?? 0) + r.seconds;
      return Object.entries(out).map(([id, seconds]) => ({ id, title: titleOf(id), minutes: Math.round(seconds / 60) })).sort((a, b) => b.minutes - a.minutes);
    };

    return {
      days,
      today,
      totals: { families: parents.length, children: live.length },
      newFamilies: { value: newNow.length, change: changePct(newNow.length, newBefore.length) },
      activeToday: { value: active(todayPlays), change: changePct(active(todayPlays), active(yesterdayPlays)) },
      minutesToday: { value: minutes(todayPlays), change: changePct(minutes(todayPlays), minutes(yesterdayPlays)) },
      minutesPeriod: { value: minutes(playsNow), change: changePct(minutes(playsNow), minutes(playsBefore)) },
      activePeriod: { value: active(playsNow), change: changePct(active(playsNow), active(playsBefore)) },
      pendingRequests: pending,
      errors24h: { total: errors.length, fresh: errors.filter((e) => e.first_at >= dayAgo).length },
      mail24h: { sent: mails.filter((m) => m.ok).length, failed: mails.filter((m) => !m.ok).length },
      series: period.map((day) => ({
        day,
        minutes: minutes(plays.filter((p) => p.day === day)),
        active: active(plays.filter((p) => p.day === day)),
        families: parents.filter((p) => createdDay(p.created_at) === day).length,
      })),
      topGames: byGame(playsNow).slice(0, 8),
      playingNow: {
        children: playing.length,
        games: Object.entries(tally(playing, (e) => e.last_game ?? 'unknown'))
          .map(([id, count]) => ({ id, title: id === 'unknown' ? null : titleOf(id), count }))
          .sort((a, b) => b.count - a.count),
      },
      languages: tally(locales, (l) => l.mail_locale ?? 'ru'),
      ages: tally(live, (k) => ageGroup(effectiveAge(k.age, extraOf.get(k.id)?.birth_month))),
      devices: tally(devices.filter((d) => d.device), (d) => d.device),
    };
  });
};
