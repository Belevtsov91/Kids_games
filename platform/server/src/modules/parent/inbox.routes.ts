import { randomBytes } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env.js';
import { db } from '../../db/index.js';
import { simpleMail } from '../../mail/layout.js';
import { mailEnabled, sendMail } from '../../mail/mailer.js';
import { MAIL_TEXT, MAIL_LANGS, mailLang } from '../../mail/texts.js';
import { hashHelperToken } from '../notify/public.routes.js';
import { requireParent } from './parentSession.js';

// Кабинет: история просьб, какие письма слать, помощники семьи (ссылки для бабушки и няни).

const mailBody = {
  type: 'object',
  properties: { notifyRequests: { type: 'boolean' }, weeklyReport: { type: 'boolean' }, locale: { type: 'string', enum: [...MAIL_LANGS] } },
  additionalProperties: false,
} as const;
const helperBody = {
  type: 'object',
  required: ['name'],
  properties: { name: { type: 'string', minLength: 1, maxLength: 40, pattern: '\\S' }, email: { type: 'string', format: 'email', maxLength: 254 }, locale: { type: 'string', enum: [...MAIL_LANGS] } },
  additionalProperties: false,
} as const;
const idParams = { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } } as const;
const MAX_HELPERS = 5;

export const inboxRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireParent);

  app.get('/inbox', async (req) => {
    const parentId = req.session!.parentId;
    const { data: kids } = await db().from('ig_children').select('id, name').eq('parent_id', parentId);
    const ids = (kids ?? []).map((k) => k.id);
    const since = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);
    const [{ data: requests, error }, { data: settings }] = await Promise.all([
      ids.length
        ? db().from('ig_time_requests').select('id, child_id, minutes, status, from_parent, created_at, answered_at').in('child_id', ids).gte('day', since).order('created_at', { ascending: false }).limit(200)
        : Promise.resolve({ data: [], error: null }),
      db().from('ig_parent_settings').select('notify_requests, weekly_report').eq('parent_id', parentId).maybeSingle(),
    ]);
    if (error) throw error;
    return {
      requests: (requests ?? []).filter((r) => !r.from_parent),
      mail: { notifyRequests: settings?.notify_requests ?? true, weeklyReport: settings?.weekly_report ?? false, enabled: mailEnabled },
    };
  });

  app.put<{ Body: { notifyRequests?: boolean; weeklyReport?: boolean; locale?: string } }>('/mail', { schema: { body: mailBody } }, async (req, reply) => {
    const row: Record<string, unknown> = { parent_id: req.session!.parentId, updated_at: new Date().toISOString() };
    if (req.body.notifyRequests !== undefined) row.notify_requests = req.body.notifyRequests;
    if (req.body.weeklyReport !== undefined) row.weekly_report = req.body.weeklyReport;
    if (req.body.locale) row.mail_locale = req.body.locale;
    const { error } = await db().from('ig_parent_settings').upsert(row, { onConflict: 'parent_id' });
    if (error) throw error;
    return reply.code(204).send();
  });

  app.get('/helpers', async (req) => {
    const { data, error } = await db().from('ig_helpers').select('id, name, email, created_at, last_used_at').eq('parent_id', req.session!.parentId).order('created_at');
    if (error) throw error;
    return data ?? [];
  });

  /** Новая ссылка помощника. Токен показываем один раз; в БД только хеш. */
  app.post<{ Body: { name: string; email?: string; locale?: string } }>('/helpers', { schema: { body: helperBody } }, async (req, reply) => {
    const parentId = req.session!.parentId;
    const { count } = await db().from('ig_helpers').select('id', { count: 'exact', head: true }).eq('parent_id', parentId);
    if ((count ?? 0) >= MAX_HELPERS) return reply.code(409).send({ error: `Не больше ${MAX_HELPERS} помощников` });
    const token = randomBytes(32).toString('base64url');
    const email = req.body.email?.trim().toLowerCase() ?? null;
    const { data, error } = await db()
      .from('ig_helpers')
      .insert({ parent_id: parentId, name: req.body.name.trim(), email, token_hash: hashHelperToken(token) })
      .select('id')
      .single();
    if (error) throw error;
    const url = `${env.appUrl}/helper#${token}`;
    if (email && mailEnabled) {
      const { data: parent } = await db().from('ig_parents').select('display_name').eq('id', parentId).single();
      const lang = mailLang(req.body.locale);
      const t = MAIL_TEXT[lang].helper;
      const mail = simpleMail({ locale: lang, subject: t.subject(parent!.display_name), title: t.title(req.body.name), lines: [t.line(parent!.display_name)], buttons: [{ label: t.open, url }], footer: 'Interact Games' });
      void sendMail({ to: email, ...mail, tag: 'helper-invite' }).catch((err) => req.log.error({ err }, 'Не удалось отправить приглашение помощнику'));
    }
    return reply.code(201).send({ id: data.id, url });
  });

  app.delete<{ Params: { id: string } }>('/helpers/:id', { schema: { params: idParams } }, async (req, reply) => {
    const { error } = await db().from('ig_helpers').delete().eq('id', req.params.id).eq('parent_id', req.session!.parentId);
    if (error) throw error;
    return reply.code(204).send();
  });
};
