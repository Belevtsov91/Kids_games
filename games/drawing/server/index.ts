import type { FastifyPluginAsync } from 'fastify';
import { drawingsRoutes } from './routes.js';

// Серверная часть рисовалки. Платформа подключает её под /api/games/drawing.
const drawingServer: FastifyPluginAsync = async (app) => {
  await app.register(drawingsRoutes, { prefix: '/drawings' });
};

export default drawingServer;
