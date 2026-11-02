import type { FastifyPluginAsync } from 'fastify';
import { childIdOf, requireChild } from '@ig/sdk/server';
import { MAX_LEVEL } from '../src/rounds.js';
import { progressRepository } from './repository.js';

// Серверная часть «Кто где живёт». Платформа подключает её под /api/games/who-lives-where.
// Прогресс привязан к ребёнку из серверной сессии: клиенту не доверяем, чей он.

const saveBody = {
  type: 'object',
  properties: {
    level: { type: 'integer', minimum: 1, maximum: MAX_LEVEL },
    found: { type: 'array', maxItems: 200, items: { type: 'string', maxLength: 40 } },
  },
  additionalProperties: false,
} as const;

const server: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireChild);

  app.get('/progress', async (req) => progressRepository.get(childIdOf(req)!));

  app.post<{ Body: { level?: number; found?: string[] } }>('/progress', { schema: { body: saveBody } }, async (req) =>
    progressRepository.save(childIdOf(req)!, req.body),
  );
};

export default server;
