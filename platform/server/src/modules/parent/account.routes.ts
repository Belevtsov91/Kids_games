import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { tokenHashFrom } from '../auth/session.js';
import { safeZone } from '../kid/timeRules.js';
import { isWeakPin } from './gate.js';
import { requireParent } from './parentSession.js';

// Аккаунт взрослого внутри кабинета: имя, фото, часовой пояс, PIN и пароль.
// Всё, что меняет вход (PIN, пароль), дополнительно требует текущий пароль.

export const PHOTO = { type: ['string', 'null'], maxLength: 400000, pattern: '^data:image/(jpeg|png|webp);base64,' } as const;
const password = { type: 'string', minLength: 1, maxLength: 72 } as const;
const strictLimit = { rateLimit: { max: 10, timeWindow: '15 minutes' } };

const profileBody = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 40, pattern: '\\S' },
    photo: PHOTO,
    timezone: { type: 'string', maxLength: 64 },
  },
  additionalProperties: false,
} as const;

const pinBody = {
  type: 'object',
  required: ['password'],
  properties: { pin: { type: 'string', pattern: '^\\d{4}$' }, password },
  additionalProperties: false,
} as const;

const passwordBody = {
  type: 'object',
  required: ['current', 'next'],
  properties: {
    current: password,
    next: { type: 'string', minLength: 8, maxLength: 72 },
    logoutOthers: { type: 'boolean' },
  },
  additionalProperties: false,
} as const;

async function passwordOk(parentId: string, value: string) {
  const { data, error } = await db().from('ig_parents').select('password_hash').eq('id', parentId).single();
  if (error) throw error;
  return verifyPassword(value, data.password_hash);
}

export const accountRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireParent);

  app.get('/account', async (req) => {
    const parentId = req.session!.parentId;
    const [{ data: parent, error }, { data: settings, error: sError }] = await Promise.all([
      db().from('ig_parents').select('display_name, email').eq('id', parentId).single(),
      db().from('ig_parent_settings').select('photo, timezone, pin_hash').eq('parent_id', parentId).maybeSingle(),
    ]);
    if (error) throw error;
    if (sError) throw sError;
    return {
      name: parent.display_name,
      email: parent.email,
      photo: settings?.photo ?? null,
      timezone: settings?.timezone ?? null,
      hasPin: Boolean(settings?.pin_hash),
    };
  });

  app.put<{ Body: { name?: string; photo?: string | null; timezone?: string } }>(
    '/account',
    { schema: { body: profileBody } },
    async (req, reply) => {
      const parentId = req.session!.parentId;
      if (req.body.name !== undefined) {
        const { error } = await db().from('ig_parents').update({ display_name: req.body.name.trim() }).eq('id', parentId);
        if (error) throw error;
      }
      const patch: Record<string, unknown> = { parent_id: parentId, updated_at: new Date().toISOString() };
      if (req.body.photo !== undefined) patch.photo = req.body.photo;
      if (req.body.timezone !== undefined) patch.timezone = safeZone(req.body.timezone);
      const { error } = await db().from('ig_parent_settings').upsert(patch, { onConflict: 'parent_id' });
      if (error) throw error;
      return reply.code(204).send();
    },
  );

  /** Задать или сменить PIN (pin), либо выключить его (pin не передан). */
  app.put<{ Body: { pin?: string; password: string } }>('/pin', { schema: { body: pinBody }, config: strictLimit }, async (req, reply) => {
    const parentId = req.session!.parentId;
    if (!(await passwordOk(parentId, req.body.password))) return reply.code(400).send({ error: 'Неверный пароль', code: 'password' });
    if (req.body.pin && isWeakPin(req.body.pin)) return reply.code(400).send({ error: 'Слишком простой PIN', code: 'weak' });
    const { error } = await db()
      .from('ig_parent_settings')
      .upsert(
        { parent_id: parentId, pin_hash: req.body.pin ? await hashPassword(req.body.pin) : null, pin_failed: 0, pin_locked_until: null },
        { onConflict: 'parent_id' },
      );
    if (error) throw error;
    return reply.code(204).send();
  });

  app.put<{ Body: { current: string; next: string; logoutOthers?: boolean } }>(
    '/password',
    { schema: { body: passwordBody }, config: strictLimit },
    async (req, reply) => {
      const parentId = req.session!.parentId;
      if (!(await passwordOk(parentId, req.body.current))) return reply.code(400).send({ error: 'Неверный пароль', code: 'password' });
      const { error } = await db().from('ig_parents').update({ password_hash: await hashPassword(req.body.next) }).eq('id', parentId);
      if (error) throw error;
      if (req.body.logoutOthers) {
        const { error: sError } = await db()
          .from('ig_sessions')
          .delete()
          .eq('parent_id', parentId)
          .neq('token_hash', tokenHashFrom(req) ?? '');
        if (sError) throw sError;
      }
      return reply.code(204).send();
    },
  );
};
