import type { FastifyPluginAsync } from 'fastify';
import { childIdOf, requireChild } from '@ig/sdk/server';
import type { Beat, BeatsRepository } from './types.js';
import { createBody, idParams, shareBody } from './schema.js';

const NOT_FOUND = { error: 'Beat not found' };

// Биты привязаны к ребёнку из серверной сессии: клиенту не доверяем, чьи они.
export const beatsRoutes: FastifyPluginAsync<{ repo: BeatsRepository }> = async (app, { repo }) => {
  app.addHook('preHandler', requireChild);

  app.get('/', async (req) => repo.list(childIdOf(req)!));

  app.post<{ Body: Pick<Beat, 'title' | 'bpm' | 'swing' | 'pattern'> }>('/', { schema: { body: createBody } }, async (req, reply) => {
    const { title, bpm, swing, pattern } = req.body;
    const beat = await repo.create({ title, bpm, swing, pattern, profileId: childIdOf(req)! });
    return reply.code(201).send(beat);
  });

  app.post<{ Params: { id: string }; Body: { shared: boolean } }>(
    '/:id/share',
    { schema: { params: idParams, body: shareBody } },
    async (req, reply) => {
      const beat = await repo.share(req.params.id, childIdOf(req)!, req.body.shared);
      return beat ?? reply.code(404).send(NOT_FOUND);
    },
  );

  app.delete<{ Params: { id: string } }>('/:id', { schema: { params: idParams } }, async (req, reply) => {
    if (!(await repo.remove(req.params.id, childIdOf(req)!))) return reply.code(404).send(NOT_FOUND);
    return reply.code(204).send();
  });
};
