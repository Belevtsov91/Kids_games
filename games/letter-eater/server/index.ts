import type { FastifyPluginAsync } from 'fastify';
import { progressRoutes } from './routes.js';

// Серверная часть Буквоеда. Платформа подключает её под /api/games/letter-eater.
const letterEaterServer: FastifyPluginAsync = async (app) => {
  await app.register(progressRoutes, { prefix: '/progress' });
};

export default letterEaterServer;
