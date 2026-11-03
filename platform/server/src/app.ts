import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { loadSession } from './modules/auth/session.js';
import { childrenRoutes } from './modules/children/children.routes.js';
import { parentRoutes } from './modules/parent/index.js';
import { kidRoutes } from './modules/kid/kid.routes.js';
import { catalogRoutes } from './games/catalog.routes.js';
import { loadGames } from './games/loader.js';
import { gameDb } from './games/gameDb.js';

export async function buildApp(options: { gamesDir?: string; logger?: boolean } = {}) {
  const app = Fastify({ logger: options.logger === false ? false : { level: env.logLevel } });

  await app.register(cors, { origin: env.corsOrigin, credentials: true });
  await app.register(cookie);
  // Общий лимит на IP; вход и регистрация ограничены строже в своих маршрутах.
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  // Подробности ошибок БД и сервера наружу не отдаём, только в лог.
  app.setErrorHandler((err: { statusCode?: number; message?: string }, req, reply) => {
    const status = err.statusCode && err.statusCode < 500 ? err.statusCode : 500;
    if (status >= 500) req.log.error({ err }, 'request failed');
    reply.code(status).send({ error: status >= 500 ? 'Ошибка сервера' : (err.message ?? 'Неверный запрос') });
  });

  app.decorateRequest('session', null);
  app.addHook('onRequest', async (req, reply) => {
    // Защита от CSRF поверх SameSite: изменяющие запросы принимаем только со своего сайта.
    const origin = req.headers.origin;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && origin && origin !== env.corsOrigin) {
      return reply.code(403).send({ error: 'Запрос с чужого сайта' });
    }
    req.session = await loadSession(req);
  });

  const games = await loadGames(options.gamesDir ?? env.gamesDir, (message) => app.log.error(message));

  // Все маршруты под /api — так же проксирует Vite в dev.
  await app.register(
    async (api) => {
      // Платформа: общее для всех игр.
      await api.register(healthRoutes);
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(childrenRoutes, { prefix: '/children' });
      await api.register(parentRoutes, { prefix: '/parent' });
      await api.register(kidRoutes, { prefix: '/kid' });
      await api.register(catalogRoutes, { prefix: '/games', catalog: games.map((g) => g.manifest) });

      // Игры: каждая в своём префиксе и в своей инкапсуляции Fastify, друг друга не видят.
      // БД игре даём только к её таблицам ig_game_<id>_*.
      for (const { manifest, plugin } of games) {
        if (plugin) await api.register(plugin, { prefix: `/games/${manifest.id}`, db: gameDb(manifest.id) });
      }
    },
    { prefix: '/api' },
  );

  return app;
}
