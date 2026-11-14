import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { MAIL_LANGS, mailLang } from '../../mail/texts.js';
import { sendResetLink } from '../auth/reset/reset.routes.js';
import { mailLocale } from '../auth/reset/email/text.js';
import { safeZone } from '../kid/timeRules.js';
import { exportFamily } from '../parent/exportData.js';
import type { GameTable } from '../parent/index.js';
import { audit } from './audit.js';
import { idParams } from './families.routes.js';

// Обычные (не опасные) действия над семьёй: исправить данные взрослого, ссылка сброса пароля, PIN,
// сессии, выгрузка данных. Каждое действие пишется в журнал с «было» и «стало».

const patchBody = {
  type: 'object',
  minProperties: 1,
  properties: {
    // Те же правила, что при регистрации (auth.routes.ts).
    name: { type: 'string', minLength: 2, maxLength: 40, pattern: "^[\\p{L}'’. -]*\\p{L}[\\p{L}'’. -]*$" },
    email: { type: 'string', format: 'email', maxLength: 254 },
    timezone: { type: 'string', minLength: 1, maxLength: 64 },
    mailLocale: { type: 'string', enum: [...MAIL_LANGS] },
  },
  additionalProperties: false,
} as const;

type Patch = { name?: string; email?: string; timezone?: string; mailLocale?: string };
type P = { Params: { id: string } };

async function parentOf(id: string) {
  const { data, error } = await db().from('ig_parents').select('id, email, display_name').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export const familyActionsRoutes: FastifyPluginAsync<{ gameTables: GameTable[] }> = async (app, opts) => {
  const missing = { error: 'Семья не найдена' };

  app.patch<P & { Body: Patch }>('/families/:id', { schema: { params: idParams, body: patchBody } }, async (req, reply) => {
    const parent = await parentOf(req.params.id);
    if (!parent) return reply.code(404).send(missing);
    const { data: settings } = await db().from('ig_parent_settings').select('timezone, mail_locale').eq('parent_id', parent.id).maybeSingle();
    const before: Record<string, unknown> = {}, after: Record<string, unknown> = {};

    const account: Record<string, string> = {};
    if (req.body.name !== undefined && req.body.name.trim() !== parent.display_name) {
      account.display_name = req.body.name.trim();
      before.name = parent.display_name;
      after.name = account.display_name;
    }
    if (req.body.email !== undefined) {
      const email = req.body.email.trim().toLowerCase();
      if (email !== parent.email) {
        const { data: taken } = await db().from('ig_parents').select('id').eq('email', email).maybeSingle();
        if (taken) return reply.code(409).send({ error: 'Эта почта уже занята другой семьёй', code: 'emailTaken' });
        account.email = email;
        before.email = parent.email;
        after.email = email;
      }
    }
    const prefs: Record<string, string> = {};
    if (req.body.timezone !== undefined) {
      const zone = safeZone(req.body.timezone);
      if (zone !== req.body.timezone) return reply.code(400).send({ error: 'Неизвестный часовой пояс', code: 'timezone' });
      if (zone !== settings?.timezone) {
        prefs.timezone = zone;
        before.timezone = settings?.timezone ?? null;
        after.timezone = zone;
      }
    }
    if (req.body.mailLocale !== undefined && req.body.mailLocale !== settings?.mail_locale) {
      prefs.mail_locale = mailLang(req.body.mailLocale);
      before.mailLocale = settings?.mail_locale ?? null;
      after.mailLocale = prefs.mail_locale;
    }
    if (!Object.keys(after).length) return reply.code(204).send();

    // Сначала журнал: изменение без записи о нём недопустимо.
    await audit(req, { action: 'family.update', targetType: 'parent', targetId: parent.id, before, after });
    if (Object.keys(account).length) {
      const { error } = await db().from('ig_parents').update(account).eq('id', parent.id);
      if (error) throw error;
    }
    if (Object.keys(prefs).length) {
      const { error } = await db().from('ig_parent_settings').upsert({ parent_id: parent.id, ...prefs, updated_at: new Date().toISOString() }, { onConflict: 'parent_id' });
      if (error) throw error;
    }
    return reply.code(204).send();
  });

  /** Письмо со ссылкой сброса пароля на почту семьи. Сам пароль владелец не видит и не задаёт. */
  app.post<P>('/families/:id/reset-link', { schema: { params: idParams } }, async (req, reply) => {
    const parent = await parentOf(req.params.id);
    if (!parent) return reply.code(404).send(missing);
    const { data: settings } = await db().from('ig_parent_settings').select('mail_locale').eq('parent_id', parent.id).maybeSingle();
    await audit(req, { action: 'family.resetLink', targetType: 'parent', targetId: parent.id });
    const sent = await sendResetLink(parent, parent.email, mailLocale(settings?.mail_locale ?? undefined), req.log);
    return sent ? { ok: true } : reply.code(503).send({ error: 'Почта не настроена, письмо не ушло', code: 'mail' });
  });

  /** Убрать PIN кабинета: семья задаст новый в кабинете. Заодно снимается блокировка. */
  app.post<P>('/families/:id/pin/reset', { schema: { params: idParams } }, async (req, reply) => {
    if (!(await parentOf(req.params.id))) return reply.code(404).send(missing);
    await audit(req, { action: 'family.pinReset', targetType: 'parent', targetId: req.params.id });
    const { error } = await db().from('ig_parent_settings').update({ pin_hash: null, pin_failed: 0, pin_locked_until: null }).eq('parent_id', req.params.id);
    if (error) throw error;
    return reply.code(204).send();
  });

  /** Снять блокировку PIN после неудачных попыток; сам PIN остаётся. */
  app.post<P>('/families/:id/pin/unlock', { schema: { params: idParams } }, async (req, reply) => {
    if (!(await parentOf(req.params.id))) return reply.code(404).send(missing);
    await audit(req, { action: 'family.pinUnlock', targetType: 'parent', targetId: req.params.id });
    const { error } = await db().from('ig_parent_settings').update({ pin_failed: 0, pin_locked_until: null }).eq('parent_id', req.params.id);
    if (error) throw error;
    return reply.code(204).send();
  });

  /** Выйти со всех устройств семьи. */
  app.post<P>('/families/:id/sessions/revoke', { schema: { params: idParams } }, async (req, reply) => {
    if (!(await parentOf(req.params.id))) return reply.code(404).send(missing);
    await audit(req, { action: 'family.sessionsRevoke', targetType: 'parent', targetId: req.params.id });
    const { error } = await db().from('ig_sessions').delete().eq('parent_id', req.params.id);
    if (error) throw error;
    return reply.code(204).send();
  });

  /** Все данные семьи одним файлом — то же, что семья выгружает из своего кабинета. */
  app.get<P>('/families/:id/export', { schema: { params: idParams } }, async (req, reply) => {
    if (!(await parentOf(req.params.id))) return reply.code(404).send(missing);
    await audit(req, { action: 'family.export', targetType: 'parent', targetId: req.params.id });
    const body = await exportFamily(req.params.id, opts.gameTables);
    return reply
      .header('Content-Disposition', `attachment; filename="family-${req.params.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json"`)
      .type('application/json; charset=utf-8')
      .send(JSON.stringify(body, null, 2));
  });
};
