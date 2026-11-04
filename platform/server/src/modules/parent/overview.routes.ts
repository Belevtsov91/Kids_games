import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { accessOf, rulesOf, settingsOf, statsOf, timeOf, zoneOf, type SettingsRow } from '../kid/childData.js';
import { localNow } from '../kid/timeRules.js';
import { ownsChild, requireParent } from './parentSession.js';
import { effectiveAge } from '../children/childView.js';

// Кабинет: обзор семьи, страница ребёнка, статистика и ответы на просьбы о времени.

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
} as const;

const statsQuery = {
  type: 'object',
  properties: { days: { type: 'integer', enum: [7, 14, 30] } },
} as const;

const answerBody = {
  type: 'object',
  required: ['approve'],
  properties: { approve: { type: 'boolean' } },
  additionalProperties: false,
} as const;

interface ChildRow {
  id: string;
  name: string;
  age: number;
  avatar: string;
}

/** Профиль ребёнка для кабинета: основа, настройки, время сегодня. */
async function childCard(child: ChildRow, zone: string) {
  const settings: SettingsRow | null = await settingsOf(child.id);
  const [time, week] = await Promise.all([timeOf(child.id, settings, zone), statsOf(child.id, zone, 7)]);
  return {
    ...child,
    age: effectiveAge(child.age, settings?.birth_month),
    toddler: settings?.toddler ?? null,
    birthMonth: settings?.birth_month?.slice(0, 7) ?? null,
    comfort: {
      musicVolume: settings?.music_volume ?? 80,
      effectsVolume: settings?.effects_volume ?? 100,
      reduceMotion: settings?.reduce_motion ?? false,
      bigButtons: settings?.big_buttons ?? false,
    },
    plan: settings?.day_plan ?? [],
    lang: settings?.lang ?? null,
    photo: settings?.photo ?? null,
    rules: rulesOf(settings),
    time,
    week: week.days,
    lastGame: [...week.games].sort((a, b) => (a.lastDay < b.lastDay ? 1 : -1))[0]?.gameId ?? null,
    playingNow: Boolean(settings?.last_beat_at && Date.now() - new Date(settings.last_beat_at).getTime() < 150_000),
  };
}

export const overviewRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireParent);

  app.get('/overview', async (req) => {
    const parentId = req.session!.parentId;
    const zone = await zoneOf(parentId);
    const { data: children, error } = await db()
      .from('ig_children')
      .select('id, name, age, avatar')
      .eq('parent_id', parentId)
      .order('created_at');
    if (error) throw error;
    const cards = await Promise.all((children ?? []).map((c) => childCard(c, zone)));
    const ids = cards.map((c) => c.id);
    const today = localNow(new Date(), zone).day;
    const { data: requests, error: rError } = ids.length
      ? await db()
          .from('ig_time_requests')
          .select('id, child_id, minutes, created_at')
          .in('child_id', ids)
          .eq('day', today)
          .eq('status', 'pending')
          .order('created_at')
      : { data: [], error: null };
    if (rError) throw rError;
    return { children: cards, requests: requests ?? [] };
  });

  app.get<{ Params: { id: string } }>('/children/:id', { schema: { params: idParams } }, async (req, reply) => {
    const parentId = req.session!.parentId;
    const { data: child, error } = await db()
      .from('ig_children')
      .select('id, name, age, avatar')
      .eq('id', req.params.id)
      .eq('parent_id', parentId)
      .maybeSingle();
    if (error) throw error;
    if (!child) return reply.code(404).send({ error: 'Профиль не найден' });
    const zone = await zoneOf(parentId);
    const [card, access] = await Promise.all([childCard(child, zone), accessOf(child.id)]);
    return { ...card, access };
  });

  app.get<{ Params: { id: string }; Querystring: { days?: number } }>(
    '/children/:id/stats',
    { schema: { params: idParams, querystring: statsQuery } },
    async (req, reply) => {
      const parentId = req.session!.parentId;
      if (!(await ownsChild(parentId, req.params.id))) return reply.code(404).send({ error: 'Профиль не найден' });
      return statsOf(req.params.id, await zoneOf(parentId), req.query.days ?? 14);
    },
  );

  /** Ответ на просьбу «ещё N минут»: одобренные минуты прибавятся к лимиту на сегодня. */
  app.post<{ Params: { id: string }; Body: { approve: boolean } }>(
    '/requests/:id',
    { schema: { params: idParams, body: answerBody } },
    async (req, reply) => {
      const { data: request, error } = await db()
        .from('ig_time_requests')
        .select('id, child_id, status')
        .eq('id', req.params.id)
        .maybeSingle();
      if (error) throw error;
      if (!request || !(await ownsChild(req.session!.parentId, request.child_id))) {
        return reply.code(404).send({ error: 'Просьба не найдена' });
      }
      if (request.status !== 'pending') return reply.code(409).send({ error: 'На просьбу уже ответили' });
      const { error: uError } = await db()
        .from('ig_time_requests')
        .update({ status: req.body.approve ? 'approved' : 'denied', answered_at: new Date().toISOString() })
        .eq('id', request.id);
      if (uError) throw uError;
      return reply.code(204).send();
    },
  );
};
