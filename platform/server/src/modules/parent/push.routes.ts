import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env.js';
import { db } from '../../db/index.js';
import { requireParent } from './parentSession.js';
import { MAX_SUBS_PER_PARENT, pushEnabled } from '../notify/push.js';

// Кабинет: включить или выключить push на этом устройстве.

const subBody = {
  type: 'object',
  required: ['endpoint', 'keys'],
  properties: {
    endpoint: { type: 'string', pattern: '^https://', minLength: 10, maxLength: 1000 },
    keys: {
      type: 'object',
      required: ['p256dh', 'auth'],
      properties: { p256dh: { type: 'string', pattern: '^[A-Za-z0-9_=-]{20,200}$' }, auth: { type: 'string', pattern: '^[A-Za-z0-9_=-]{8,100}$' } },
    },
  },
} as const;
const endpointBody = { type: 'object', required: ['endpoint'], properties: { endpoint: { type: 'string', maxLength: 1000 } }, additionalProperties: false } as const;

export const pushRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireParent);

  app.get('/push', async () => ({ enabled: pushEnabled, key: pushEnabled ? env.push.publicKey : null }));

  app.post<{ Body: { endpoint: string; keys: { p256dh: string; auth: string } } }>('/push', { schema: { body: subBody } }, async (req, reply) => {
    if (!pushEnabled) return reply.code(503).send({ error: 'Уведомления не настроены' });
    const parentId = req.session!.parentId;
    const { endpoint, keys } = req.body;
    // Тот же браузер мог быть подписан на другого взрослого: подписка переходит к тому, кто включил сейчас.
    await db().from('ig_push_subs').delete().eq('endpoint', endpoint);
    const { count } = await db().from('ig_push_subs').select('id', { count: 'exact', head: true }).eq('parent_id', parentId);
    if ((count ?? 0) >= MAX_SUBS_PER_PARENT) {
      const { data: oldest } = await db().from('ig_push_subs').select('id').eq('parent_id', parentId).order('created_at').limit(1);
      if (oldest?.[0]) await db().from('ig_push_subs').delete().eq('id', oldest[0].id);
    }
    const { error } = await db().from('ig_push_subs').insert({ parent_id: parentId, endpoint, p256dh: keys.p256dh, auth: keys.auth });
    if (error) throw error;
    return reply.code(204).send();
  });

  app.delete<{ Body: { endpoint: string } }>('/push', { schema: { body: endpointBody } }, async (req, reply) => {
    const { error } = await db().from('ig_push_subs').delete().eq('endpoint', req.body.endpoint).eq('parent_id', req.session!.parentId);
    if (error) throw error;
    return reply.code(204).send();
  });
};
