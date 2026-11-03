import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { requireSession, setActiveChild } from '../auth/session.js';
import { guardSwitch } from './switchGuard.js';

// Профили детей. Родитель видит и меняет только своих: parent_id всегда берётся из сессии, не из запроса.

const MAX_CHILDREN = 10;

const createBody = {
  type: 'object',
  required: ['name', 'age', 'avatar'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 40, pattern: '\\S' },
    age: { type: 'integer', minimum: 3, maximum: 15 },
    avatar: { type: 'string', minLength: 1, maxLength: 16 },
  },
  additionalProperties: false,
} as const;

const activeBody = {
  type: 'object',
  required: ['childId'],
  properties: { childId: { type: 'string', format: 'uuid' } },
  additionalProperties: false,
} as const;

export const childrenRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireSession);

  app.post<{ Body: { name: string; age: number; avatar: string } }>(
    '/',
    { schema: { body: createBody } },
    async (req, reply) => {
      const parentId = req.session!.parentId;
      if (!(await guardSwitch(req, reply, null))) return reply;
      const { count, error: countError } = await db()
        .from('ig_children')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', parentId);
      if (countError) throw countError;
      if ((count ?? 0) >= MAX_CHILDREN) return reply.code(409).send({ error: `Не больше ${MAX_CHILDREN} профилей` });

      const { data, error } = await db()
        .from('ig_children')
        .insert({ parent_id: parentId, name: req.body.name.trim(), age: req.body.age, avatar: req.body.avatar })
        .select('id, name, age, avatar')
        .single();
      if (error) throw error;
      return reply.code(201).send(data);
    },
  );

  /** Какой ребёнок сейчас играет. Хранится в серверной сессии, не в браузере. */
  app.put<{ Body: { childId: string } }>('/active', { schema: { body: activeBody } }, async (req, reply) => {
    const { data, error } = await db()
      .from('ig_children')
      .select('id')
      .eq('id', req.body.childId)
      .eq('parent_id', req.session!.parentId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return reply.code(404).send({ error: 'Профиль не найден' });
    if (!(await guardSwitch(req, reply, data.id))) return reply;
    await setActiveChild(req, data.id);
    return reply.code(204).send();
  });
};
