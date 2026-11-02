import type { FastifyPluginAsync } from 'fastify';
import { melodiesRoutes } from './routes.js';

// Серверная часть оркестра. Платформа подключает её под /api/games/animal-orchestra.
const orchestraServer: FastifyPluginAsync = async (app) => {
  await app.register(melodiesRoutes, { prefix: '/melodies' });
};

export default orchestraServer;
