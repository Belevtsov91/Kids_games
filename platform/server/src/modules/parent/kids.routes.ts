import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { zoneOf } from '../kid/childData.js';
import { localNow } from '../kid/timeRules.js';
import { PHOTO } from './account.routes.js';
import { effectiveAge } from '../children/childView.js';
import { ownsChild, requireParent } from './parentSession.js';

// Кабинет: изменить профиль ребёнка, правила времени и доступ к играм, дать время, удалить профиль.

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
} as const;

const minutes = { type: ['integer', 'null'], minimum: 5, maximum: 600 } as const;
const clock = { type: ['string', 'null'], pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' } as const;

const patchBody = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 40, pattern: '\\S' },
    age: { type: 'integer', minimum: 3, maximum: 15 },
    avatar: { type: 'string', minLength: 1, maxLength: 16 },
    lang: { type: ['string', 'null'], enum: ['ru', 'uk', 'ro', 'en', null] },
    photo: PHOTO,
    limitWeekday: minutes,
    limitWeekend: minutes,
    quietFrom: clock,
    quietTo: clock,
    breakEvery: { type: 'integer', minimum: 0, maximum: 120 },
    canAsk: { type: 'boolean' },
    toddler: { type: ['boolean', 'null'] },
    birthMonth: { type: ['string', 'null'], pattern: '^20\\d\\d-(0[1-9]|1[0-2])$' },
    musicVolume: { type: 'integer', minimum: 0, maximum: 100 },
    effectsVolume: { type: 'integer', minimum: 0, maximum: 100 },
    reduceMotion: { type: 'boolean' },
    bigButtons: { type: 'boolean' },
  },
  additionalProperties: false,
} as const;

interface PatchBody {
  name?: string;
  age?: number;
  avatar?: string;
  lang?: string | null;
  photo?: string | null;
  limitWeekday?: number | null;
  limitWeekend?: number | null;
  quietFrom?: string | null;
  quietTo?: string | null;
  breakEvery?: number;
  canAsk?: boolean;
  toddler?: boolean | null;
  birthMonth?: string | null;
  musicVolume?: number;
  effectsVolume?: number;
  reduceMotion?: boolean;
  bigButtons?: boolean;
}

/** Поле запроса → колонка ig_child_settings. */
const SETTINGS_FIELDS: [keyof PatchBody, string][] = [
  ['lang', 'lang'],
  ['photo', 'photo'],
  ['limitWeekday', 'limit_weekday'],
  ['limitWeekend', 'limit_weekend'],
  ['quietFrom', 'quiet_from'],
  ['quietTo', 'quiet_to'],
  ['breakEvery', 'break_every'],
  ['canAsk', 'can_ask'],
  ['toddler', 'toddler'],
  ['musicVolume', 'music_volume'],
  ['effectsVolume', 'effects_volume'],
  ['reduceMotion', 'reduce_motion'],
  ['bigButtons', 'big_buttons'],
];

const gameParams = {
  type: 'object',
  required: ['id', 'gameId'],
  properties: { id: { type: 'string', format: 'uuid' }, gameId: { type: 'string', pattern: '^[a-z0-9-]{1,40}$' } },
} as const;

const accessBody = {
  type: 'object',
  required: ['allowed'],
  properties: { allowed: { type: ['boolean', 'null'] } },
  additionalProperties: false,
} as const;

const bonusBody = {
  type: 'object',
  required: ['minutes'],
  properties: { minutes: { type: 'integer', enum: [5, 10, 15, 30, 60] } },
  additionalProperties: false,
} as const;

export const kidsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireParent);

  // Все маршруты с :id — только для своих детей.
  app.addHook<{ Params: { id?: string } }>('preHandler', async (req, reply) => {
    const id = req.params?.id;
    if (id && !(await ownsChild(req.session!.parentId, id))) return reply.code(404).send({ error: 'Профиль не найден' });
  });

  app.patch<{ Params: { id: string }; Body: PatchBody }>(
    '/children/:id',
    { schema: { params: idParams, body: patchBody } },
    async (req, reply) => {
      const { name, avatar, birthMonth } = req.body;
      // Месяц рождения задаёт и возраст: дальше он растёт сам (см. childView).
      const age = birthMonth ? effectiveAge(req.body.age ?? 3, `${birthMonth}-01`) : req.body.age;
      const base = Object.fromEntries(
        Object.entries({ name: name?.trim(), age, avatar }).filter(([, v]) => v !== undefined),
      );
      if (Object.keys(base).length) {
        const { error } = await db().from('ig_children').update(base).eq('id', req.params.id);
        if (error) throw error;
      }
      const settings: Record<string, unknown> = {};
      for (const [field, column] of SETTINGS_FIELDS) if (req.body[field] !== undefined) settings[column] = req.body[field];
      if (birthMonth !== undefined) settings.birth_month = birthMonth && `${birthMonth}-01`;
      if (Object.keys(settings).length) {
        const { error } = await db()
          .from('ig_child_settings')
          .upsert({ child_id: req.params.id, ...settings, updated_at: new Date().toISOString() }, { onConflict: 'child_id' });
        if (error) throw error;
      }
      return reply.code(204).send();
    },
  );

  /** Удалить профиль ребёнка: сохранения всех игр, рисунки и время удаляются каскадом. */
  app.delete<{ Params: { id: string } }>('/children/:id', { schema: { params: idParams } }, async (req, reply) => {
    const { error } = await db().from('ig_children').delete().eq('id', req.params.id);
    if (error) throw error;
    return reply.code(204).send();
  });

  /** Открыть (true) или закрыть (false) игру вручную; null — снова по возрасту. */
  app.put<{ Params: { id: string; gameId: string }; Body: { allowed: boolean | null } }>(
    '/children/:id/games/:gameId',
    { schema: { params: gameParams, body: accessBody } },
    async (req, reply) => {
      const key = { child_id: req.params.id, game_id: req.params.gameId };
      const { error } =
        req.body.allowed === null
          ? await db().from('ig_child_game_access').delete().match(key)
          : await db().from('ig_child_game_access').upsert({ ...key, allowed: req.body.allowed });
      if (error) throw error;
      return reply.code(204).send();
    },
  );

  /** Разовая прибавка на сегодня от взрослого. */
  app.post<{ Params: { id: string }; Body: { minutes: number } }>(
    '/children/:id/bonus',
    { schema: { params: idParams, body: bonusBody } },
    async (req, reply) => {
      const day = localNow(new Date(), await zoneOf(req.session!.parentId)).day;
      const { error } = await db().from('ig_time_requests').insert({
        child_id: req.params.id,
        day,
        minutes: req.body.minutes,
        status: 'approved',
        from_parent: true,
        answered_at: new Date().toISOString(),
      });
      if (error) throw error;
      return reply.code(201).send({ ok: true });
    },
  );
};
