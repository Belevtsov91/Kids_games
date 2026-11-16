import type { FastifyPluginAsync } from 'fastify';
import { parentCanView } from '@ig/sdk/server';
import type { MelodiesRepository } from './repository.js';

// Мелодии для кабинета родителя (страница «Творчество»): взрослый с открытым кабинетом
// слушает и удаляет мелодии своего ребёнка. Чей ребёнок — проверяет платформа (parentCanView).

const params = {
  type: 'object',
  required: ['childId'],
  properties: { childId: { type: 'string', format: 'uuid' }, id: { type: 'string', maxLength: 64 } },
} as const;
const FORBIDDEN = { error: 'Нужен кабинет родителя' };

export const parentMelodiesRoutes: FastifyPluginAsync<{ repo: MelodiesRepository }> = async (app, { repo }) => {
  app.addHook<{ Params: { childId: string } }>('preHandler', async (req, reply) => {
    if (!(await parentCanView(req, req.params.childId))) return reply.code(403).send(FORBIDDEN);
  });

  app.get<{ Params: { childId: string } }>('/:childId', { schema: { params } }, async (req) => repo.list(req.params.childId));

  app.delete<{ Params: { childId: string; id: string } }>('/:childId/:id', { schema: { params } }, async (req, reply) => {
    if (!(await repo.remove(req.params.id, req.params.childId))) return reply.code(404).send({ error: 'Melody not found' });
    return reply.code(204).send();
  });
};
