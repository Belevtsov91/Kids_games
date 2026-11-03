import type { FastifyPluginAsync } from 'fastify';
import { childIdOf, requireChild, type GameServerOptions } from '@ig/sdk/server';
import { LEVEL_COUNT, createProgressRepository } from './repository.js';

const saveBody = {
  type: 'object',
  required: ['level', 'stars'],
  properties: {
    level: { type: 'integer', minimum: 0, maximum: LEVEL_COUNT - 1 },
    stars: { type: 'integer', minimum: 1, maximum: 3 },
  },
  additionalProperties: false,
} as const;

// Прогресс привязан к ребёнку из серверной сессии: клиенту не доверяем, чей он.
export const progressRoutes: FastifyPluginAsync<GameServerOptions> = async (app, opts) => {
  const progressRepository = createProgressRepository(opts.db);
  app.addHook('preHandler', requireChild);

  app.get('/', async (req) => ({ stars: await progressRepository.get(childIdOf(req)!) }));

  app.post<{ Body: { level: number; stars: number } }>('/', { schema: { body: saveBody } }, async (req) => ({
    stars: await progressRepository.saveBest(childIdOf(req)!, req.body.level, req.body.stars),
  }));
};
