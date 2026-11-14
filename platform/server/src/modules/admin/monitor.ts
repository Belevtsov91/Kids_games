import type { FastifyBaseLogger } from 'fastify';
import { db } from '../../db/index.js';
import { allRows, countRows, soft, sum } from './data.js';
import { healthSnapshot, type GameStatus } from './health.routes.js';
import { alertStep } from './healthRules.js';
import { sendTelegram } from './telegram.js';

// Автоматическая проверка раз в 5 минут и утренняя сводка. Запускаются снаружи (POST /api/jobs/health и /digest):
// бесплатный Render засыпает, а сам вызов заодно не даёт ему уснуть.
// «Сайт вообще не отвечает» отсюда не увидеть — за этим следит внешний сторож (GitHub Actions), см. admin/README.

/** Проверки, сбой которых стоит тревоги. Незаданные переменные и ненакатанная миграция — не авария. */
const CRITICAL = (id: string) => id === 'db' || id === 'mail' || id === 'games' || id === 'job:weekly-report' || id === 'job:cleanup';

export async function runHealthCheck(games: GameStatus[], log: FastifyBaseLogger) {
  const snapshot = await healthSnapshot(games);
  const failed = snapshot.checks.filter((c) => !c.ok && CRITICAL(c.id));
  const ok = failed.length === 0;
  const previous = await soft(() => allRows<{ ok: boolean; alerted: boolean }>('ig_health_checks', 'ok, alerted', (q) => q.order('created_at', { ascending: false }).limit(50)), []);
  const step = alertStep(ok, previous);
  let alerted = false;
  if (step === 'alert') alerted = await sendTelegram(`⚠️ Сайт игр: сбой дольше 5 минут\n${failed.map((c) => `• ${c.id}: ${c.note}`).join('\n')}`);
  if (step === 'recovered') await sendTelegram('✅ Сайт игр: всё снова в порядке');
  const { error } = await db().from('ig_health_checks').insert({ ok, details: snapshot.checks, alerted });
  if (error) log.warn({ err: error }, 'Проверка здоровья: запись не сохранена (миграция 008 накатана?)');
  // Историю держим неделю: 288 проверок в сутки.
  await db().from('ig_health_checks').delete().lt('created_at', new Date(Date.now() - 7 * 86_400_000).toISOString());
  return { ok, failed: failed.map((c) => c.id), step };
}

/** Утренняя сводка за прошедшие сутки. */
export async function sendDigest() {
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const yesterday = dayAgo.slice(0, 10);
  const [families, fresh, plays, errors, mailsFailed, pending, checks] = await Promise.all([
    countRows('ig_parents'),
    countRows('ig_parents', (q) => q.gte('created_at', dayAgo)),
    allRows<{ child_id: string; seconds: number }>('ig_play_daily', 'child_id, seconds', (q) => q.eq('day', yesterday)),
    soft(() => countRows('ig_error_log', (q) => q.gte('last_at', dayAgo).is('resolved_at', null)), 0),
    soft(() => countRows('ig_mail_log', (q) => q.gte('created_at', dayAgo).eq('ok', false)), 0),
    countRows('ig_time_requests', (q) => q.eq('status', 'pending').gte('created_at', dayAgo)),
    soft(() => allRows<{ ok: boolean }>('ig_health_checks', 'ok', (q) => q.gte('created_at', dayAgo)), []),
  ]);
  const down = checks.filter((c) => !c.ok).length;
  const text = [
    '☀️ Сайт игр: сводка за сутки',
    `Семей: ${families} (новых: ${fresh})`,
    `Играли детей: ${new Set(plays.map((p) => p.child_id)).size}, минут: ${Math.round(sum(plays.map((p) => p.seconds)) / 60)}`,
    `Ошибок: ${errors}, писем не ушло: ${mailsFailed}, просьб без ответа: ${pending}`,
    checks.length ? `Проверок: ${checks.length}, со сбоем: ${down}` : 'Автопроверки за сутки не запускались',
  ].join('\n');
  return sendTelegram(text);
}

/** Чистка журналов: действия владельца храним год, остальные журналы — 90 дней. */
export async function pruneLogs(now = new Date()) {
  const year = new Date(now.getTime() - 365 * 86_400_000).toISOString();
  const quarter = new Date(now.getTime() - 90 * 86_400_000).toISOString();
  await Promise.all([
    db().from('ig_admin_audit').delete().lt('created_at', year),
    db().from('ig_mail_log').delete().lt('created_at', quarter),
    db().from('ig_login_failures').delete().lt('created_at', quarter),
    db().from('ig_job_runs').delete().lt('started_at', quarter),
    db().from('ig_error_log').delete().lt('last_at', quarter),
  ]);
}
