import type { FastifyPluginAsync } from 'fastify';
import { childIdOf, requireChild, type GameServerOptions } from '@ig/sdk/server';
import { createProgressRepository } from './repository.js';

// Серверная часть садовника. Платформа подключает её под /api/games/space-gardener.
// Прогресс привязан к ребёнку из серверной сессии: клиенту не доверяем, чей он.

const recordBody = {
  type: 'object',
  required: ['levelId', 'stars'],
  properties: {
    levelId: { type: 'string', pattern: '^[a-z0-9-]{1,40}$' },
    stars: { type: 'integer', minimum: 1, maximum: 3 },
  },
  additionalProperties: false,
} as const;

const spaceGardenerServer: FastifyPluginAsync<GameServerOptions> = async (app, opts) => {
  const progressRepository = createProgressRepository(opts.db);
  app.addHook('preHandler', requireChild);

  app.get('/progress', async (req) => progressRepository.get(childIdOf(req)!));

  app.post<{ Body: { levelId: string; stars: number } }>('/progress', { schema: { body: recordBody } }, async (req) =>
    progressRepository.record(childIdOf(req)!, req.body.levelId, req.body.stars),
  );
};

export default spaceGardenerServer;
