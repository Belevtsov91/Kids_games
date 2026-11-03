import type { FastifyPluginAsync } from 'fastify';
import type { GameServerOptions } from '@ig/sdk/server';
import { progressRoutes } from './routes.js';

// Серверная часть Буквоеда. Платформа подключает её под /api/games/letter-eater.
const letterEaterServer: FastifyPluginAsync<GameServerOptions> = async (app, opts) => {
  await app.register(progressRoutes, { prefix: '/progress', db: opts.db });
};

export default letterEaterServer;
