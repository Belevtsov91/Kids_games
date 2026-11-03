import type { FastifyPluginAsync } from 'fastify';

// Падения игр в браузере: только в лог сервера, без данных о ребёнке и без таблиц.
const body = {
  type: 'object',
  required: ['message'],
  properties: { path: { type: 'string', maxLength: 80 }, message: { type: 'string', maxLength: 300 } },
  additionalProperties: false,
} as const;

export const errorsRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { path?: string; message: string } }>(
    '/errors',
    { schema: { body }, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req, reply) => {
      req.log.warn({ path: req.body.path, message: req.body.message }, 'ошибка в игре (браузер)');
      return reply.code(204).send();
    },
  );
};
