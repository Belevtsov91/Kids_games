import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { ANIMAL_IDS } from '../src/game/animals.js';
import { MAX_NOTES, MAX_SONG_MS } from '../src/game/song.js';
import { melodiesRepository, type Melody } from './repository.js';

// Мелодии привязаны к ребёнку из серверной сессии: клиенту не доверяем, чьи они.
const childOf = (req: FastifyRequest) => (req as { session?: { activeChildId?: string | null } | null }).session?.activeChildId ?? null;

const createBody = {
  type: 'object',
  required: ['notes'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 60, default: 'Моя мелодия' },
    notes: {
      type: 'array',
      minItems: 1,
      maxItems: MAX_NOTES,
      items: {
        type: 'object',
        required: ['a', 't', 'm'],
        properties: {
          a: { type: 'string', enum: ANIMAL_IDS },
          t: { type: 'integer', minimum: 0, maximum: MAX_SONG_MS },
          m: { type: 'string', enum: ['instrument', 'voice'] },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
} as const;

export const melodiesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (req, reply) => {
    const childId = childOf(req);
    if (!childId) return reply.code(401).send({ error: 'Нужно выбрать ребёнка' });
    return melodiesRepository.list(childId);
  });

  app.post<{ Body: Pick<Melody, 'title' | 'notes'> }>('/', { schema: { body: createBody } }, async (req, reply) => {
    const childId = childOf(req);
    if (!childId) return reply.code(401).send({ error: 'Нужно выбрать ребёнка' });
    const melody = await melodiesRepository.create({ ...req.body, profileId: childId });
    return reply.code(201).send(melody);
  });

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const childId = childOf(req);
    if (!childId) return reply.code(401).send({ error: 'Нужно выбрать ребёнка' });
    const removed = await melodiesRepository.remove(req.params.id, childId);
    if (!removed) return reply.code(404).send({ error: 'Melody not found' });
    return reply.code(204).send();
  });
};
