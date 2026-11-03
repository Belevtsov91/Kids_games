import { createHash } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { localNow } from '../kid/timeRules.js';
import { zoneOf } from '../kid/childData.js';
import { readAnswerToken } from './answerToken.js';
import { answerRequest, answerSecret } from './notify.js';

// Страницы без входа: ответ на просьбу из письма (/answer#токен) и помощник семьи (/helper#токен).

const limit = { rateLimit: { max: 30, timeWindow: '15 minutes' } };
const tokenBody = { type: 'object', required: ['token'], properties: { token: { type: 'string', maxLength: 300 } } } as const;
const answerBody = {
  type: 'object',
  required: ['token', 'requestId', 'approve'],
  properties: { token: { type: 'string', pattern: '^[A-Za-z0-9_-]{43}$' }, requestId: { type: 'string', format: 'uuid' }, approve: { type: 'boolean' } },
  additionalProperties: false,
} as const;

export const hashHelperToken = (token: string) => createHash('sha256').update(token).digest('hex');

async function helperOf(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const { data, error } = await db().from('ig_helpers').select('id, parent_id, name').eq('token_hash', hashHelperToken(token)).maybeSingle();
  if (error) throw error;
  if (data) await db().from('ig_helpers').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);
  return data;
}

export const publicNotifyRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { token: string } }>('/answer', { schema: { body: tokenBody }, config: limit }, async (req) => {
    const read = answerSecret() ? readAnswerToken(answerSecret(), req.body.token) : null;
    if (!read) return { status: 'gone' };
    return answerRequest(read.requestId, read.approve);
  });

  /** Помощник: просьбы детей семьи на сегодня. */
  app.post<{ Body: { token: string } }>('/helper', { schema: { body: tokenBody }, config: limit }, async (req, reply) => {
    const helper = await helperOf(req.body.token);
    if (!helper) return reply.code(410).send({ error: 'Ссылка отозвана' });
    const { data: kids } = await db().from('ig_children').select('id, name, avatar').eq('parent_id', helper.parent_id);
    const ids = (kids ?? []).map((k) => k.id);
    const day = localNow(new Date(), await zoneOf(helper.parent_id)).day;
    const { data: requests, error } = ids.length
      ? await db().from('ig_time_requests').select('id, child_id, minutes, status, created_at').in('child_id', ids).eq('day', day).eq('from_parent', false).order('created_at', { ascending: false })
      : { data: [], error: null };
    if (error) throw error;
    return { helper: helper.name, kids: kids ?? [], requests: requests ?? [] };
  });

  app.post<{ Body: { token: string; requestId: string; approve: boolean } }>('/helper/answer', { schema: { body: answerBody }, config: limit }, async (req, reply) => {
    const helper = await helperOf(req.body.token);
    if (!helper) return reply.code(410).send({ error: 'Ссылка отозвана' });
    return answerRequest(req.body.requestId, req.body.approve, helper.parent_id);
  });
};
