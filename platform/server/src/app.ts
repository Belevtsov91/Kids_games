import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { loadSession, tokenHashFrom } from './modules/auth/session.js';
import { ownsChild, parentStatus } from './modules/parent/parentSession.js';
import { childrenRoutes } from './modules/children/children.routes.js';
import { parentRoutes } from './modules/parent/index.js';
import { kidRoutes } from './modules/kid/kid.routes.js';
import { progressRoutes } from './modules/progress/progress.routes.js';
import { errorsRoutes } from './modules/progress/errors.routes.js';
import { publicNotifyRoutes } from './modules/notify/public.routes.js';
import { catalogRoutes } from './games/catalog.routes.js';
import { loadGames } from './games/loader.js';
import { gameDb } from './games/gameDb.js';
import { supabase } from './db/index.js';
import { startWeeklyReports } from './modules/notify/weekly.js';
import { jobsRoutes } from './modules/jobs/jobs.routes.js';
import { startCleanup } from './modules/jobs/cleanup.js';

export async function buildApp(options: { gamesDir?: string; logger?: boolean; jobs?: boolean } = {}) {
  // trustProxy: за Vercel → Render настоящий адрес посетителя приходит в X-Forwarded-For (см. TRUST_PROXY).
  const hops = env.trustProxy;
  const trustProxy = typeof hops === 'number' ? (_address: string, hop: number) => hop < hops : hops;
  const app = Fastify({ logger: options.logger === false ? false : { level: env.logLevel }, trustProxy });

  await app.register(cors, { origin: env.corsOrigins, credentials: true });
  await app.register(cookie);
  // Общий лимит: на сессию, если она есть (её не подделать), иначе на IP посетителя
  // (за прокси — из X-Forwarded-For, см. TRUST_PROXY). Вход и регистрация ограничены строже в своих маршрутах.
  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
    keyGenerator: (req) => {
      const token = tokenHashFrom(req);
      return token ? `s:${token}` : `ip:${req.ip}`;
    },
  });

  // Подробности ошибок БД и сервера наружу не отдаём, только в лог.
  app.setErrorHandler((err: { statusCode?: number; message?: string }, req, reply) => {
    const status = err.statusCode && err.statusCode < 500 ? err.statusCode : 500;
    if (status >= 500) req.log.error({ err }, 'request failed');
    reply.code(status).send({ error: status >= 500 ? 'Ошибка сервера' : (err.message ?? 'Неверный запрос') });
  });

  app.decorateRequest('session', null);
  // Для игр (@ig/sdk/server → parentCanView): взрослый с открытым кабинетом смотрит данные своего ребёнка.
  app.decorateRequest('canParentView', null);
  app.addHook('onRequest', async (req, reply) => {
    // Защита от CSRF поверх SameSite: изменяющие запросы принимаем только со своего сайта.
    const origin = req.headers.origin;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && origin && !env.corsOrigins.includes(origin)) {
      return reply.code(403).send({ error: 'Запрос с чужого сайта' });
    }
    req.session = await loadSession(req);
    req.canParentView = async (childId: string) =>
      Boolean(req.session && /^[0-9a-f-]{36}$/i.test(childId) && (await parentStatus(req)) && (await ownsChild(req.session.parentId, childId)));
  });

  const games = await loadGames(options.gamesDir ?? env.gamesDir, (message) => app.log.error(message));

  // Все маршруты под /api — так же проксирует Vite в dev.
  await app.register(
    async (api) => {
      // Платформа: общее для всех игр.
      await api.register(healthRoutes);
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(childrenRoutes, { prefix: '/children' });
      await api.register(parentRoutes, { prefix: '/parent', gameTables: games.flatMap((g) => g.tables.map((table) => ({ gameId: g.manifest.id, table }))) });
      await api.register(kidRoutes, { prefix: '/kid' });
      await api.register(progressRoutes, { prefix: '/kid', catalog: games.map((g) => g.manifest) });
      await api.register(errorsRoutes);
      await api.register(publicNotifyRoutes);
      await api.register(catalogRoutes, { prefix: '/games', catalog: games.map((g) => g.manifest) });
      await api.register(jobsRoutes, { prefix: '/jobs', catalog: games.map((g) => g.manifest) });

      // Игры: каждая в своём префиксе и в своей инкапсуляции Fastify, друг друга не видят.
      // БД игре даём только к её таблицам ig_game_<id>_*.
      for (const { manifest, plugin } of games) {
        if (!plugin) continue;
        try {
          await api.register(plugin, { prefix: `/games/${manifest.id}`, db: gameDb(manifest.id) });
        } catch (err) {
          app.log.error({ err }, `${manifest.id}: сервер игры не запустился, остальные игры работают`);
        }
      }
    },
    { prefix: '/api' },
  );

  // Фоновые задачи (отчёт за неделю) — только в настоящем сервере и только с БД.
  if (options.jobs && supabase) {
    const stops = [startWeeklyReports(games.map((g) => g.manifest), app.log), startCleanup(app.log)];
    app.addHook('onClose', async () => stops.forEach((stop) => stop()));
  }

  return app;
}
