import type { FastifyPluginAsync } from 'fastify';
import { islandsRoutes } from './routes.js';

// Серверная часть острова. Платформа подключает её под /api/games/island-builder.
const islandServer: FastifyPluginAsync = async (app) => {
  await app.register(islandsRoutes, { prefix: '/island' });
};

export default islandServer;
