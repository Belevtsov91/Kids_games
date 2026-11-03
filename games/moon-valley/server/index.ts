import type { FastifyPluginAsync } from 'fastify';
import type { GameServerOptions } from '@ig/sdk/server';
import { saveRoutes } from './routes.js';

// Серверная часть Лунной Долины. Платформа подключает её под /api/games/moon-valley.
const moonValleyServer: FastifyPluginAsync<GameServerOptions> = async (app, opts) => {
  await app.register(saveRoutes, { prefix: '/save', db: opts.db });
};

export default moonValleyServer;
