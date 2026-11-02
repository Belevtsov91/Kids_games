import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { LEVEL_COUNT, progressRepository } from './repository.js';

// Сессию кладёт платформа (httpOnly-cookie → req.session). Игра описывает только нужные ей поля,
// не импортируя сервер платформы.
interface SessionLike {
  parentId: string;
  activeChildId: string | null;
}

/** Чей прогресс: выбранного ребёнка, а если ребёнок не выбран — родителя. Id приходит только с сервера, не из запроса. */
function ownerOf(req: FastifyRequest): string | null {
  const session = (req as FastifyRequest & { session?: SessionLike | null }).session;
  if (!session?.parentId) return null;
  return session.activeChildId ? `child:${session.activeChildId}` : `parent:${session.parentId}`;
}

const saveBody = {
  type: 'object',
  required: ['level', 'stars'],
  properties: {
    level: { type: 'integer', minimum: 0, maximum: LEVEL_COUNT - 1 },
    stars: { type: 'integer', minimum: 1, maximum: 3 },
  },
  additionalProperties: false,
} as const;

export const progressRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (req, reply) => {
    const owner = ownerOf(req);
    if (!owner) return reply.code(401).send({ error: 'Нужно войти' });
    return { stars: await progressRepository.get(owner) };
  });

  app.post<{ Body: { level: number; stars: number } }>('/', { schema: { body: saveBody } }, async (req, reply) => {
    const owner = ownerOf(req);
    if (!owner) return reply.code(401).send({ error: 'Нужно войти' });
    return { stars: await progressRepository.saveBest(owner, req.body.level, req.body.stars) };
  });
};
