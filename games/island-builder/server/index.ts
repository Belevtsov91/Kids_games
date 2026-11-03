import type { FastifyPluginAsync } from 'fastify';
import type { GameServerOptions } from '@ig/sdk/server';
import { islandsRoutes } from './routes.js';

// Серверная часть острова. Платформа подключает её под /api/games/island-builder.
const islandServer: FastifyPluginAsync<GameServerOptions> = async (app, opts) => {
  await app.register(islandsRoutes, { prefix: '/island', db: opts.db });
};

export default islandServer;
