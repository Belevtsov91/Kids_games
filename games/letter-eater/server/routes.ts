import type { FastifyPluginAsync } from 'fastify';
import { playerKeyOf, requirePlayer } from '@ig/sdk/server';
import { LEVEL_COUNT, progressRepository } from './repository.js';

const saveBody = {
  type: 'object',
  required: ['level', 'stars'],
  properties: {
    level: { type: 'integer', minimum: 0, maximum: LEVEL_COUNT - 1 },
    stars: { type: 'integer', minimum: 1, maximum: 3 },
  },
  additionalProperties: false,
} as const;

// Чей прогресс: выбранного ребёнка, а если ребёнок не выбран — родителя. Id приходит только из сессии.
export const progressRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requirePlayer);

  app.get('/', async (req) => ({ stars: await progressRepository.get(playerKeyOf(req)!) }));

  app.post<{ Body: { level: number; stars: number } }>('/', { schema: { body: saveBody } }, async (req) => ({
    stars: await progressRepository.saveBest(playerKeyOf(req)!, req.body.level, req.body.stars),
  }));
};
