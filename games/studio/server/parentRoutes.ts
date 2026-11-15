import type { FastifyPluginAsync } from 'fastify';
import { parentCanView } from '@ig/sdk/server';
import type { BeatsRepository } from './types.js';
import { parentParams } from './schema.js';

// Биты для кабинета родителя: взрослый с открытым кабинетом слушает те биты своего ребёнка,
// которые ребёнок сам отметил «Показать родителям». Чей ребёнок — проверяет платформа.

const FORBIDDEN = { error: 'Нужен кабинет родителя' };

export const parentBeatsRoutes: FastifyPluginAsync<{ repo: BeatsRepository }> = async (app, { repo }) => {
  app.addHook<{ Params: { childId: string } }>('preHandler', async (req, reply) => {
    if (!(await parentCanView(req, req.params.childId))) return reply.code(403).send(FORBIDDEN);
  });

  app.get<{ Params: { childId: string } }>('/:childId', { schema: { params: parentParams } }, async (req) => repo.listShared(req.params.childId));
};
