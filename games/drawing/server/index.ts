import type { FastifyPluginAsync } from 'fastify';
import type { GameServerOptions } from '@ig/sdk/server';
import { drawingsRoutes } from './routes.js';

// Серверная часть рисовалки. Платформа подключает её под /api/games/drawing.
const drawingServer: FastifyPluginAsync<GameServerOptions> = async (app, opts) => {
  await app.register(drawingsRoutes, { prefix: '/drawings', db: opts.db });
};

export default drawingServer;
