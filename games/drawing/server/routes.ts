import type { FastifyPluginAsync } from 'fastify';
import { childIdOf, requireChild } from '@ig/sdk/server';
import { drawingsRepository, type Drawing } from './repository.js';

const createBody = {
  type: 'object',
  required: ['image'],
  properties: {
    title: { type: 'string', maxLength: 80, default: 'Без названия' },
    image: { type: 'string', pattern: '^data:image/png;base64,' },
  },
  additionalProperties: false,
} as const;

const NOT_FOUND = { error: 'Drawing not found' };

// Рисунки привязаны к ребёнку из серверной сессии: клиенту не доверяем, чьи они.
export const drawingsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireChild);

  app.get('/', async (req) => drawingsRepository.list(childIdOf(req)!));

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const drawing = await drawingsRepository.get(req.params.id, childIdOf(req)!);
    if (!drawing) return reply.code(404).send(NOT_FOUND);
    return drawing;
  });

  app.post<{ Body: Pick<Drawing, 'title' | 'image'> }>(
    '/',
    // Картинки бывают тяжёлыми: лимит тела выше стандартного 1 МБ.
    { schema: { body: createBody }, bodyLimit: 10 * 1024 * 1024 },
    async (req, reply) => {
      const drawing = await drawingsRepository.create({ ...req.body, profileId: childIdOf(req)! });
      return reply.code(201).send({ id: drawing.id, createdAt: drawing.createdAt });
    },
  );

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const removed = await drawingsRepository.remove(req.params.id, childIdOf(req)!);
    if (!removed) return reply.code(404).send(NOT_FOUND);
    return reply.code(204).send();
  });
};
