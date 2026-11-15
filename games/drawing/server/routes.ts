import type { FastifyPluginAsync } from 'fastify';
import { childIdOf, requireChild, type GameServerOptions } from '@ig/sdk/server';
import { createDrawingsRepository, type Drawing } from './repository.js';
import { ALBUM_FULL, MAX_DRAWINGS_PER_CHILD, MAX_IMAGE_CHARS } from '../src/limits.js';

const createBody = {
  type: 'object',
  required: ['image'],
  properties: {
    title: { type: 'string', maxLength: 80, default: 'Без названия' },
    image: { type: 'string', pattern: '^data:image/png;base64,', maxLength: MAX_IMAGE_CHARS },
  },
  additionalProperties: false,
} as const;

const NOT_FOUND = { error: 'Drawing not found' };

// Рисунки привязаны к ребёнку из серверной сессии: клиенту не доверяем, чьи они.
export const drawingsRoutes: FastifyPluginAsync<GameServerOptions> = async (app, opts) => {
  const drawingsRepository = createDrawingsRepository(opts.db);
  app.addHook('preHandler', requireChild);

  app.get('/', async (req) => drawingsRepository.list(childIdOf(req)!));

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const drawing = await drawingsRepository.get(req.params.id, childIdOf(req)!);
    if (!drawing) return reply.code(404).send(NOT_FOUND);
    return drawing;
  });

  app.post<{ Body: Pick<Drawing, 'title' | 'image'> }>(
    '/',
    // Картинка больше стандартного 1 МБ, но не больше лимита рисунка (плюс запас на название).
    { schema: { body: createBody }, bodyLimit: MAX_IMAGE_CHARS + 64 * 1024 },
    async (req, reply) => {
      const profileId = childIdOf(req)!;
      if ((await drawingsRepository.count(profileId)) >= MAX_DRAWINGS_PER_CHILD) {
        return reply.code(409).send({ error: 'Album is full', code: ALBUM_FULL, limit: MAX_DRAWINGS_PER_CHILD });
      }
      const drawing = await drawingsRepository.create({ ...req.body, profileId });
      return reply.code(201).send({ id: drawing.id, createdAt: drawing.createdAt });
    },
  );

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const removed = await drawingsRepository.remove(req.params.id, childIdOf(req)!);
    if (!removed) return reply.code(404).send(NOT_FOUND);
    return reply.code(204).send();
  });
};
