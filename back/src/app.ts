import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { gamesRoutes } from './modules/games/games.routes.js';
import { profilesRoutes } from './modules/profiles/profiles.routes.js';
import { drawingsRoutes } from './modules/drawings/drawings.routes.js';

export async function buildApp() {
  const app = Fastify({ logger: { level: env.logLevel } });

  await app.register(cors, { origin: env.corsOrigin });

  // Все маршруты под /api — так же проксирует Vite в dev.
  await app.register(
    async (api) => {
      await api.register(healthRoutes);
      await api.register(gamesRoutes, { prefix: '/games' });
      await api.register(profilesRoutes, { prefix: '/profiles' });
      await api.register(drawingsRoutes, { prefix: '/drawings' });
    },
    { prefix: '/api' },
  );

  return app;
}
