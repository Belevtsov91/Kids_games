import { timingSafeEqual } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import type { GameManifest } from '@ig/sdk/manifest';
import { env } from '../../config/env.js';
import { supabase } from '../../db/index.js';
import { sendWeeklyReports } from '../notify/weekly.js';
import { cleanup } from './cleanup.js';

// Задачи по расписанию снаружи (Render Cron Job, Vercel Cron, cron-job.org): бесплатный Render
// засыпает, и setInterval внутри сервера в воскресенье вечером может не сработать.
// Вызов: POST /api/jobs/hourly с заголовком x-cron-secret: <CRON_SECRET>. Без CRON_SECRET маршрута нет.

const sameSecret = (given: string | undefined, expected: string) => {
  const a = Buffer.from(given ?? ''), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

export const jobsRoutes: FastifyPluginAsync<{ catalog: GameManifest[] }> = async (app, opts) => {
  const secret = env.cronSecret;
  if (!secret) return;

  app.addHook('onRequest', async (req, reply) => {
    const header = req.headers['x-cron-secret'];
    if (!sameSecret(Array.isArray(header) ? header[0] : header, secret)) return reply.code(404).send({ error: 'Не найдено' });
    if (!supabase) return reply.code(503).send({ error: 'БД не настроена' });
  });

  /** Раз в час: отчёт за неделю (сам решит, кому пора: воскресенье после 18:00 по времени семьи). */
  app.post('/hourly', async (req) => {
    await sendWeeklyReports(opts.catalog, req.log);
    return { ok: true };
  });

  /** Раз в сутки: чистка просроченного. */
  app.post('/daily', async (req) => {
    await cleanup(req.log);
    return { ok: true };
  });
};
