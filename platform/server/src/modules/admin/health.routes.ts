import type { FastifyPluginAsync } from 'fastify';
import type { GameManifest } from '@ig/sdk/manifest';
import { env } from '../../config/env.js';
import { db } from '../../db/index.js';
import { mailEnabled } from '../../mail/mailer.js';
import { cleanup } from '../jobs/cleanup.js';
import { tracked } from '../jobs/tracked.js';
import { sendWeeklyReports } from '../notify/weekly.js';
import { audit } from './audit.js';
import { allRows, countRows, soft } from './data.js';
import { jobHealth, type JobRun } from './healthRules.js';

// Здоровье: отвечает ли база, настроена ли почта, каких переменных не хватает, какие игры загрузились,
// когда шли фоновые задачи, сколько места занято. И ручной запуск задач.

export interface GameStatus {
  id: string;
  title: string;
  /** У игры есть серверная часть. */
  hasServer: boolean;
  /** Серверная часть загрузилась (для игр без сервера — true). */
  serverOk: boolean;
}

/** Бесплатные лимиты, которые можно измерить отсюда: база Supabase и письма Brevo в сутки. */
const LIMITS = { dbBytes: 500 * 1024 * 1024, mailsPerDay: 300 };

const jobParams = { type: 'object', required: ['job'], properties: { job: { type: 'string', enum: ['weekly-report', 'cleanup'] } } } as const;

/** Переменные окружения, без которых что-то не работает. Значения не показываем — только имена. */
export function missingEnv() {
  const missing: string[] = [];
  if (!env.cronSecret) missing.push('CRON_SECRET');
  if (!mailEnabled) missing.push('BREVO_API_KEY или SMTP_USER/SMTP_PASSWORD, MAIL_FROM_EMAIL');
  if (!env.admin.origins.length) missing.push('ADMIN_ORIGIN');
  if (!env.admin.telegramToken || !env.admin.telegramChat) missing.push('TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID');
  if (env.isProduction && !env.cookieSecure) missing.push('COOKIE_SECURE=true');
  return missing;
}

export async function healthSnapshot(games: GameStatus[]) {
  const started = Date.now();
  const ping = await db().from('ig_parents').select('id', { count: 'exact', head: true });
  const dbMs = Date.now() - started;
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();

  const [runs, migration, sizes, dbBytes, mailsToday, mailsFailed] = await Promise.all([
    soft(() => allRows<JobRun>('ig_job_runs', 'job, ok, note, manual, started_at', (q) => q.order('started_at', { ascending: false }).limit(200)), []),
    soft(async () => ((await countRows('ig_site_flags')) >= 0), false),
    soft(async () => {
      const { data, error } = await db().rpc('ig_admin_table_sizes');
      if (error) throw error;
      return (data ?? []) as { name: string; bytes: number; row_estimate: number }[];
    }, []),
    soft(async () => {
      const { data, error } = await db().rpc('ig_admin_db_size');
      if (error) throw error;
      return Number(data);
    }, null as number | null),
    soft(() => countRows('ig_mail_log', (q) => q.gte('created_at', dayAgo)), 0),
    soft(() => countRows('ig_mail_log', (q) => q.gte('created_at', dayAgo).eq('ok', false)), 0),
  ]);

  const failedGames = games.filter((g) => !g.serverOk);
  const missing = missingEnv();
  const jobs = jobHealth(runs, new Date());
  return {
    at: new Date().toISOString(),
    checks: [
      { id: 'db', ok: !ping.error, note: ping.error ? 'нет ответа' : `${dbMs} мс` },
      { id: 'migration', ok: migration, note: migration ? '008 накатана' : 'миграция 008 не накатана' },
      { id: 'mail', ok: mailEnabled && mailsFailed === 0, note: !mailEnabled ? 'почта не настроена' : mailsFailed ? `не ушло за сутки: ${mailsFailed}` : `ушло за сутки: ${mailsToday}` },
      { id: 'games', ok: failedGames.length === 0, note: failedGames.length ? `не загрузились: ${failedGames.map((g) => g.id).join(', ')}` : `${games.filter((g) => g.hasServer).length} с сервером, все загрузились` },
      ...jobs.map((j) => ({ id: `job:${j.job}`, ok: j.ok, note: j.note })),
      { id: 'env', ok: missing.length === 0, note: missing.length ? `не задано: ${missing.join('; ')}` : 'все переменные заданы' },
    ],
    jobs,
    tables: sizes.slice(0, 12),
    limits: { dbBytes, dbLimit: LIMITS.dbBytes, mailsToday, mailsLimit: LIMITS.mailsPerDay },
  };
}

export const healthAdminRoutes: FastifyPluginAsync<{ games: GameStatus[]; catalog: GameManifest[] }> = async (app, opts) => {
  app.get('/health', async () => healthSnapshot(opts.games));

  /** Последние автоматические проверки (раз в 5 минут) — история для графика «работал / лежал». */
  app.get('/health/history', async () =>
    soft(() => allRows('ig_health_checks', 'ok, details, alerted, created_at', (q) => q.order('created_at', { ascending: false }).limit(288)), []),
  );

  /** Запустить задачу сейчас. Отчёт за неделю сам решит, кому пора (воскресенье после 18:00 по времени семьи). */
  app.post<{ Params: { job: 'weekly-report' | 'cleanup' } }>('/jobs/:job/run', { schema: { params: jobParams } }, async (req) => {
    await audit(req, { action: 'job.run', targetType: 'job', targetId: req.params.job });
    const work = req.params.job === 'cleanup' ? () => cleanup(req.log) : () => sendWeeklyReports(opts.catalog, req.log);
    await tracked(req.params.job, work, true);
    return { ok: true };
  });
};
