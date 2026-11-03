import type { FastifyPluginAsync } from 'fastify';
import { childIdOf, requireChild, type GameServerOptions } from '@ig/sdk/server';
import { ANIMAL_IDS } from '../src/game/animals.js';
import { MAX_NOTES, MAX_SONG_MS } from '../src/game/song.js';
import { createMelodiesRepository, type Melody } from './repository.js';

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

// Мелодии привязаны к ребёнку из серверной сессии: клиенту не доверяем, чьи они.
export const melodiesRoutes: FastifyPluginAsync<GameServerOptions> = async (app, opts) => {
  const melodiesRepository = createMelodiesRepository(opts.db);
  app.addHook('preHandler', requireChild);

  app.get('/', async (req) => melodiesRepository.list(childIdOf(req)!));

  app.post<{ Body: Pick<Melody, 'title' | 'notes'> }>('/', { schema: { body: createBody } }, async (req, reply) => {
    const childId = childIdOf(req)!;
    const melody = await melodiesRepository.create({ ...req.body, profileId: childId });
    return reply.code(201).send(melody);
  });

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const childId = childIdOf(req)!;
    const removed = await melodiesRepository.remove(req.params.id, childId);
    if (!removed) return reply.code(404).send({ error: 'Melody not found' });
    return reply.code(204).send();
  });
};
