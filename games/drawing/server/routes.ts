import type { FastifyPluginAsync } from 'fastify';
import { drawingsRepository, type Drawing } from './repository.js';

const createBody = {
  type: 'object',
  required: ['profileId', 'image'],
  properties: {
    profileId: { type: 'string', minLength: 1 },
    title: { type: 'string', maxLength: 80, default: 'Без названия' },
    image: { type: 'string', pattern: '^data:image/png;base64,' },
  },
  additionalProperties: false,
} as const;

export const drawingsRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { profileId?: string } }>('/', async (req) => drawingsRepository.list(req.query.profileId));

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const drawing = await drawingsRepository.get(req.params.id);
    if (!drawing) return reply.code(404).send({ error: 'Drawing not found' });
    return drawing;
  });

  app.post<{ Body: Pick<Drawing, 'profileId' | 'title' | 'image'> }>(
    '/',
    // Картинки бывают тяжёлыми: лимит тела выше стандартного 1 МБ.
    { schema: { body: createBody }, bodyLimit: 10 * 1024 * 1024 },
    async (req, reply) => {
      const drawing = await drawingsRepository.create(req.body);
      return reply.code(201).send({ id: drawing.id, createdAt: drawing.createdAt });
    },
  );

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const removed = await drawingsRepository.remove(req.params.id);
    if (!removed) return reply.code(404).send({ error: 'Drawing not found' });
    return reply.code(204).send();
  });
};
