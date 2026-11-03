import type { FastifyPluginAsync } from 'fastify';
import type { GameServerOptions } from '@ig/sdk/server';
import { melodiesRoutes } from './routes.js';

// Серверная часть оркестра. Платформа подключает её под /api/games/animal-orchestra.
const orchestraServer: FastifyPluginAsync<GameServerOptions> = async (app, opts) => {
  await app.register(melodiesRoutes, { prefix: '/melodies', db: opts.db });
};

export default orchestraServer;
