import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { requireSession, setActiveChild } from '../auth/session.js';
import { effectiveAge } from './childView.js';
import { defaultRules } from './profileRules.js';
import { childCount, guardSwitch } from './switchGuard.js';

// Профили детей. Родитель видит и меняет только своих: parent_id всегда берётся из сессии, не из запроса.

export const MAX_CHILDREN = 10;

const createBody = {
  type: 'object',
  required: ['name', 'avatar'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 40, pattern: '\\S' },
    age: { type: 'integer', minimum: 3, maximum: 15 },
    // Месяц рождения «YYYY-MM» вместо возраста: тогда возраст и игры по возрасту растут сами.
    birthMonth: { type: 'string', pattern: '^20\\d\\d-(0[1-9]|1[0-2])$' },
    avatar: { type: 'string', minLength: 1, maxLength: 16 },
    // false — без правил времени по возрасту (взрослый решил сам или задаст их в первой настройке).
    rules: { type: 'boolean' },
    // Сразу выбрать новый профиль: тем же разрешением взрослого, что и создание.
    activate: { type: 'boolean' },
  },
  additionalProperties: false,
} as const;

interface CreateBody {
  name: string;
  age?: number;
  birthMonth?: string;
  avatar: string;
  rules?: boolean;
  activate?: boolean;
}

const activeBody = {
  type: 'object',
  required: ['childId'],
  properties: { childId: { type: 'string', format: 'uuid' } },
  additionalProperties: false,
} as const;

export const childrenRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireSession);

  app.post<{ Body: CreateBody }>('/', { schema: { body: createBody } }, async (req, reply) => {
    const parentId = req.session!.parentId;
    const { name, avatar, birthMonth } = req.body;
    if (req.body.age === undefined && !birthMonth) return reply.code(400).send({ error: 'Нужен возраст или месяц рождения' });
    if ((await childCount(parentId)) >= MAX_CHILDREN) return reply.code(409).send({ error: `Не больше ${MAX_CHILDREN} профилей` });
    // Новый профиль (кроме первого) — только со взрослым: иначе ребёнок заводит себе профиль без лимита.
    if (!(await guardSwitch(req, reply, null))) return reply;

    const age = birthMonth ? effectiveAge(3, `${birthMonth}-01`) : req.body.age!;
    const { data, error } = await db()
      .from('ig_children')
      .insert({ parent_id: parentId, name: name.trim(), age, avatar })
      .select('id, name, age, avatar')
      .single();
    if (error) throw error;

    const settings = {
      ...(req.body.rules === false ? {} : defaultRules(age)),
      ...(birthMonth ? { birth_month: `${birthMonth}-01` } : {}),
    };
    if (Object.keys(settings).length) {
      const { error: sError } = await db().from('ig_child_settings').insert({ child_id: data.id, ...settings });
      if (sError) {
        // Без транзакции в supabase-js: профиль без правил не оставляем, пусть взрослый попробует ещё раз.
        await db().from('ig_children').delete().eq('id', data.id);
        throw sError;
      }
    }
    if (req.body.activate) await setActiveChild(req, data.id);
    return reply.code(201).send(data);
  });

  /** Какой ребёнок сейчас играет. Хранится в серверной сессии, не в браузере. */
  app.put<{ Body: { childId: string } }>('/active', { schema: { body: activeBody } }, async (req, reply) => {
    const { data, error } = await db()
      .from('ig_children')
      .select('id')
      .eq('id', req.body.childId)
      .eq('parent_id', req.session!.parentId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return reply.code(404).send({ error: 'Профиль не найден' });
    if (!(await guardSwitch(req, reply, data.id))) return reply;
    await setActiveChild(req, data.id);
    return reply.code(204).send();
  });
};
