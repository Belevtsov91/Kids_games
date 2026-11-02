import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { MAX_LEVEL } from '../src/rounds.js';
import { progressRepository } from './repository.js';

// Серверная часть «Кто где живёт». Платформа подключает её под /api/games/who-lives-where.
// Прогресс привязан к ребёнку из серверной сессии: клиенту не доверяем, чей он.

const childOf = (req: FastifyRequest) => (req as { session?: { activeChildId?: string | null } | null }).session?.activeChildId ?? null;

const saveBody = {
  type: 'object',
  properties: {
    level: { type: 'integer', minimum: 1, maximum: MAX_LEVEL },
    found: { type: 'array', maxItems: 200, items: { type: 'string', maxLength: 40 } },
  },
  additionalProperties: false,
} as const;

const server: FastifyPluginAsync = async (app) => {
  app.get('/progress', async (req, reply) => {
    const childId = childOf(req);
    if (!childId) return reply.code(401).send({ error: 'Нужно выбрать ребёнка' });
    return progressRepository.get(childId);
  });

  app.post<{ Body: { level?: number; found?: string[] } }>('/progress', { schema: { body: saveBody } }, async (req, reply) => {
    const childId = childOf(req);
    if (!childId) return reply.code(401).send({ error: 'Нужно выбрать ребёнка' });
    return progressRepository.save(childId, req.body);
  });
};

export default server;
