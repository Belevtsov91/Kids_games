import type { FastifyPluginAsync } from 'fastify';
import { progressRepository } from './repository.js';

// Серверная часть садовника. Платформа подключает её под /api/games/space-gardener.

const profileId = { type: 'string', minLength: 1, maxLength: 100 } as const;

const recordBody = {
  type: 'object',
  required: ['profileId', 'levelId', 'stars'],
  properties: {
    profileId,
    levelId: { type: 'string', pattern: '^[a-z0-9-]{1,40}$' },
    stars: { type: 'integer', minimum: 1, maximum: 3 },
  },
  additionalProperties: false,
} as const;

const spaceGardenerServer: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { profileId: string } }>(
    '/progress',
    { schema: { querystring: { type: 'object', required: ['profileId'], properties: { profileId } } } },
    async (req) => progressRepository.get(req.query.profileId),
  );

  app.post<{ Body: { profileId: string; levelId: string; stars: number } }>(
    '/progress',
    { schema: { body: recordBody } },
    async (req) => progressRepository.record(req.body.profileId, req.body.levelId, req.body.stars),
  );
};

export default spaceGardenerServer;
