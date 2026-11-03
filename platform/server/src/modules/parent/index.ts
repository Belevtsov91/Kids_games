import type { FastifyPluginAsync } from 'fastify';
import { sessionsEnabled } from '../auth/session.js';
import { gateRoutes } from './gate.routes.js';
import { accountRoutes } from './account.routes.js';
import { overviewRoutes } from './overview.routes.js';
import { kidsRoutes } from './kids.routes.js';
import { progressParentRoutes } from './progress.routes.js';
import { inboxRoutes } from './inbox.routes.js';
import { setupRoutes } from './setup.routes.js';

/** Кабинет родителя (/api/parent): вход по задаче и PIN, обзор семьи, профили детей, аккаунт. */
export const parentRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (_req, reply) => {
    if (!sessionsEnabled) return reply.code(503).send({ error: 'Вход временно недоступен' });
  });
  await app.register(gateRoutes);
  await app.register(accountRoutes);
  await app.register(overviewRoutes);
  await app.register(kidsRoutes);
  await app.register(progressParentRoutes);
  await app.register(inboxRoutes);
  await app.register(setupRoutes);
};
