import type { FastifyPluginAsync } from 'fastify';
import { parentCanView, type GameServerOptions } from '@ig/sdk/server';
import { createDrawingsRepository } from './repository.js';

// Рисунки для кабинета родителя: взрослый с открытым кабинетом видит, скачивает и удаляет
// рисунки любого своего ребёнка. Чей ребёнок — проверяет платформа (parentCanView).

const params = {
  type: 'object',
  required: ['childId'],
  properties: { childId: { type: 'string', format: 'uuid' }, id: { type: 'string', maxLength: 64 } },
} as const;
const FORBIDDEN = { error: 'Нужен кабинет родителя' };

export const parentDrawingsRoutes: FastifyPluginAsync<GameServerOptions> = async (app, opts) => {
  const repo = createDrawingsRepository(opts.db);

  app.addHook<{ Params: { childId: string } }>('preHandler', async (req, reply) => {
    if (!(await parentCanView(req, req.params.childId))) return reply.code(403).send(FORBIDDEN);
  });

  app.get<{ Params: { childId: string } }>('/:childId', { schema: { params } }, async (req) => repo.list(req.params.childId));

  app.get<{ Params: { childId: string; id: string } }>('/:childId/:id', { schema: { params } }, async (req, reply) => {
    const drawing = await repo.get(req.params.id, req.params.childId);
    if (!drawing) return reply.code(404).send({ error: 'Drawing not found' });
    return drawing;
  });

  app.delete<{ Params: { childId: string; id: string } }>('/:childId/:id', { schema: { params } }, async (req, reply) => {
    if (!(await repo.remove(req.params.id, req.params.childId))) return reply.code(404).send({ error: 'Drawing not found' });
    return reply.code(204).send();
  });
};
