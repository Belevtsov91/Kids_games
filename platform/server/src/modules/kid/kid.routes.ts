import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../../db/index.js';
import { accessOf, rulesOf, settingsOf, statsOf, timeOf, zoneOf } from './childData.js';
import { beatSeconds, localNow } from './timeRules.js';

// Страницы ребёнка: сколько осталось играть, «пульс» игры, просьба о времени, своя статистика.
// Ребёнок берётся только из сессии; родительский кабинет для этого не нужен.

const MAX_REQUESTS_PER_DAY = 3;
export const ASK_MINUTES = [5, 10, 15, 30] as const;

const tzQuery = {
  type: 'object',
  properties: { tz: { type: 'string', maxLength: 64 } },
} as const;

const beatBody = {
  type: 'object',
  required: ['gameId'],
  properties: { gameId: { type: 'string', pattern: '^[a-z0-9-]{1,40}$' }, tz: { type: 'string', maxLength: 64 } },
  additionalProperties: false,
} as const;

const askBody = {
  type: 'object',
  required: ['minutes'],
  properties: { minutes: { type: 'integer', enum: [...ASK_MINUTES] }, tz: { type: 'string', maxLength: 64 } },
  additionalProperties: false,
} as const;

async function requireChild(req: FastifyRequest, reply: FastifyReply) {
  if (!req.session) return reply.code(401).send({ error: 'Нужно войти' });
  if (!req.session.activeChildId) return reply.code(409).send({ error: 'Нужно выбрать ребёнка' });
}

async function lastRequest(childId: string, day: string) {
  const { data, error } = await db()
    .from('ig_time_requests')
    .select('id, minutes, status, created_at')
    .eq('child_id', childId)
    .eq('day', day)
    .eq('from_parent', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return { last: data?.[0] ?? null, count: data?.length ?? 0 };
}

/** Всё, что нужно таймеру ребёнка, одним ответом. */
async function statusOf(childId: string, parentId: string, tz?: string) {
  const [settings, zone] = await Promise.all([settingsOf(childId), zoneOf(parentId, tz)]);
  const [time, access] = await Promise.all([timeOf(childId, settings, zone), accessOf(childId)]);
  const { last, count } = await lastRequest(childId, time.day);
  return {
    time,
    rules: rulesOf(settings),
    breakEvery: settings?.break_every ?? 0,
    canAsk: (settings?.can_ask ?? true) && count < MAX_REQUESTS_PER_DAY,
    access,
    request: last && { id: last.id, minutes: last.minutes, status: last.status },
  };
}

export const kidRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireChild);

  app.get<{ Querystring: { tz?: string } }>('/status', { schema: { querystring: tzQuery } }, async (req) =>
    statusOf(req.session!.activeChildId!, req.session!.parentId, req.query.tz),
  );

  /** Раз в минуту, пока игра открыта и видна. Засчитывает время с прошлого пульса, не больше минуты. */
  app.post<{ Body: { gameId: string; tz?: string } }>('/beat', { schema: { body: beatBody } }, async (req) => {
    const childId = req.session!.activeChildId!;
    const now = new Date();
    const [settings, zone] = await Promise.all([settingsOf(childId), zoneOf(req.session!.parentId, req.body.tz)]);
    const before = await timeOf(childId, settings, zone, now);
    const add = before.blocked ? 0 : beatSeconds(settings?.last_beat_at ? new Date(settings.last_beat_at) : null, now);
    if (add > 0) {
      const day = localNow(now, zone).day;
      const { data, error } = await db()
        .from('ig_play_daily')
        .select('seconds')
        .eq('child_id', childId)
        .eq('day', day)
        .eq('game_id', req.body.gameId)
        .maybeSingle();
      if (error) throw error;
      const { error: upError } = await db()
        .from('ig_play_daily')
        .upsert({ child_id: childId, day, game_id: req.body.gameId, seconds: (data?.seconds ?? 0) + add });
      if (upError) throw upError;
    }
    const { error } = await db()
      .from('ig_child_settings')
      .upsert({ child_id: childId, last_beat_at: now.toISOString() }, { onConflict: 'child_id' });
    if (error) throw error;
    return statusOf(childId, req.session!.parentId, req.body.tz);
  });

  /** «Попросить ещё»: одна просьба за раз и не больше трёх в день. Ответ приходит в кабинет родителя. */
  app.post<{ Body: { minutes: number; tz?: string } }>('/requests', { schema: { body: askBody } }, async (req, reply) => {
    const childId = req.session!.activeChildId!;
    const [settings, zone] = await Promise.all([settingsOf(childId), zoneOf(req.session!.parentId, req.body.tz)]);
    if (settings && !settings.can_ask) return reply.code(403).send({ error: 'Просить время выключено' });
    const day = localNow(new Date(), zone).day;
    const { last, count } = await lastRequest(childId, day);
    if (last?.status === 'pending') return reply.code(409).send({ error: 'Просьба уже отправлена' });
    if (count >= MAX_REQUESTS_PER_DAY) return reply.code(429).send({ error: 'На сегодня просьб хватит' });
    const { data, error } = await db()
      .from('ig_time_requests')
      .insert({ child_id: childId, day, minutes: req.body.minutes })
      .select('id, minutes, status')
      .single();
    if (error) throw error;
    return reply.code(201).send(data);
  });

  /** Своя статистика ребёнка за неделю: «сколько я играл». */
  app.get<{ Querystring: { tz?: string } }>('/stats', { schema: { querystring: tzQuery } }, async (req) => {
    const zone = await zoneOf(req.session!.parentId, req.query.tz);
    return statsOf(req.session!.activeChildId!, zone, 7);
  });
};
