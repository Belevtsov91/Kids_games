import type { FastifyBaseLogger } from 'fastify';
import { env } from '../../config/env.js';
import { derivedSecret } from '../../config/keys.js';
import { db } from '../../db/index.js';
import { simpleMail } from '../../mail/layout.js';
import { mailEnabled, sendMail } from '../../mail/mailer.js';
import { MAIL_TEXT, mailLang } from '../../mail/texts.js';
import { answerToken } from './answerToken.js';

// Письмо родителю, когда ребёнок просит время. Кнопки отвечают сразу, без входа (подписанная ссылка).

export const answerSecret = () => derivedSecret('answer');

/**
 * Письмо о просьбе ребёнка: взрослому (если не выключил) и помощникам семьи, у которых есть почта.
 * Кнопки во всех письмах одинаковые: подписанный ответ работает без входа, отвечает тот, кто первый.
 */
export async function notifyRequest(childId: string, requestId: string, minutes: number, log: FastifyBaseLogger) {
  const { data: child } = await db().from('ig_children').select('name, parent_id').eq('id', childId).maybeSingle();
  if (!child || !answerSecret()) return;
  const [{ data: parent }, { data: settings }, { data: helpers }] = await Promise.all([
    db().from('ig_parents').select('email').eq('id', child.parent_id).maybeSingle(),
    db().from('ig_parent_settings').select('notify_requests, mail_locale').eq('parent_id', child.parent_id).maybeSingle(),
    db().from('ig_helpers').select('email').eq('parent_id', child.parent_id).not('email', 'is', null),
  ]);
  const recipients = [
    ...(parent && settings?.notify_requests !== false ? [parent.email] : []),
    ...(helpers ?? []).map((h) => h.email as string),
  ].filter((email, i, all) => email && all.indexOf(email) === i);
  if (!recipients.length) return;
  const lang = mailLang(settings?.mail_locale);
  const t = MAIL_TEXT[lang];
  const link = (approve: boolean) => `${env.appUrl}/answer#${answerToken(answerSecret(), requestId, approve)}`;
  const mail = simpleMail({
    locale: lang,
    subject: t.request.subject(child.name, minutes),
    title: t.request.subject(child.name, minutes),
    lines: [t.request.line(child.name, minutes)],
    buttons: [
      { label: t.request.allow(minutes), url: link(true) },
      { label: t.request.deny, url: link(false), ghost: true },
    ],
    footer: t.footer,
  });
  if (!mailEnabled) return log.info({ allow: link(true), recipients: recipients.length }, 'Почта не настроена: письмо о просьбе не отправлено');
  const results = await Promise.allSettled(recipients.map((to) => sendMail({ to, ...mail, tag: 'time-request' })));
  for (const r of results) if (r.status === 'rejected') log.error({ err: r.reason }, 'Не удалось отправить письмо о просьбе');
}

/** Ответить на просьбу (из письма или от помощника). Возвращает итог для страницы ответа. */
export async function answerRequest(requestId: string, approve: boolean, parentId?: string) {
  const { data: request, error } = await db().from('ig_time_requests').select('id, child_id, minutes, status').eq('id', requestId).maybeSingle();
  if (error) throw error;
  if (!request) return { status: 'gone' as const };
  const { data: child } = await db().from('ig_children').select('name, parent_id').eq('id', request.child_id).maybeSingle();
  if (!child || (parentId && child.parent_id !== parentId)) return { status: 'gone' as const };
  if (request.status !== 'pending') return { status: 'gone' as const, name: child.name };
  const { error: uError } = await db()
    .from('ig_time_requests')
    .update({ status: approve ? 'approved' : 'denied', answered_at: new Date().toISOString() })
    .eq('id', request.id)
    .eq('status', 'pending');
  if (uError) throw uError;
  return { status: approve ? ('approved' as const) : ('denied' as const), name: child.name, minutes: request.minutes };
}
