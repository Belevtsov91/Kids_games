import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env.js';
import { db } from '../../db/index.js';
import { simpleMail } from '../../mail/layout.js';
import { mailEnabled, sendMail } from '../../mail/mailer.js';
import { MAIL_LANGS, MAIL_TEXT, mailLang, type MailLang } from '../../mail/texts.js';
import { resetPasswordMail } from '../auth/reset/email/template.js';
import { mailLocale } from '../auth/reset/email/text.js';
import { RESET_TTL_MIN, sendResetLink } from '../auth/reset/reset.routes.js';
import { WARN_DAYS } from '../children/profileRules.js';
import { INACTIVE_MAIL } from '../jobs/retentionText.js';
import { audit } from './audit.js';

// Письма: предпросмотр шаблонов на четырёх языках, тестовое письмо себе, повторная отправка из журнала.
// В предпросмотре — выдуманные имена и неработающие ссылки: настоящих данных семей тут нет.

const TEMPLATES = ['password-reset', 'time-request', 'weekly-report', 'helper-invite', 'inactive-warning'] as const;
type Template = (typeof TEMPLATES)[number];

const templateQuery = {
  type: 'object',
  required: ['template'],
  properties: { template: { type: 'string', enum: [...TEMPLATES] }, locale: { type: 'string', enum: [...MAIL_LANGS] } },
} as const;

const SAMPLE_URL = `${env.appUrl}/#sample`;

/** Письмо-образец: тот же шаблон и те же тексты, что уходят семьям, с выдуманными именами. */
export function sampleMail(template: Template, lang: MailLang) {
  const t = MAIL_TEXT[lang];
  if (template === 'password-reset') return resetPasswordMail({ locale: mailLocale(lang), name: 'Анна', url: SAMPLE_URL, minutes: RESET_TTL_MIN });
  if (template === 'time-request') {
    return simpleMail({ locale: lang, subject: t.request.subject('Мира', 15), title: t.request.subject('Мира', 15), lines: [t.request.line('Мира', 15)], buttons: [{ label: t.request.allow(15), url: SAMPLE_URL }, { label: t.request.deny, url: SAMPLE_URL, ghost: true }], footer: t.footer });
  }
  if (template === 'weekly-report') {
    return simpleMail({ locale: lang, subject: t.weekly.subject, title: t.weekly.title, lines: [t.weekly.lead], rows: [[`Мира · ${t.weekly.played}`, '3:20'], [t.weekly.favorite, '🎨'], [t.weekly.learned, '4'], [t.weekly.stickers, '6']], buttons: [{ label: t.weekly.open, url: SAMPLE_URL }], footer: `${t.weekly.tips[0]} · ${t.weekly.off}` });
  }
  if (template === 'helper-invite') {
    return simpleMail({ locale: lang, subject: t.helper.subject('Анна'), title: t.helper.title('Нина'), lines: [t.helper.line('Анна')], buttons: [{ label: t.helper.open, url: SAMPLE_URL }], footer: t.footer });
  }
  const i = INACTIVE_MAIL[lang];
  return simpleMail({ locale: lang, subject: i.subject, title: i.subject, lines: [i.line(WARN_DAYS)], buttons: [{ label: i.open, url: SAMPLE_URL }], footer: i.footer });
}

export const mailAdminRoutes: FastifyPluginAsync = async (app) => {
  /** Как выглядит письмо: тема, HTML и текстовая версия. */
  app.get<{ Querystring: { template: Template; locale?: string } }>('/mail/preview', { schema: { querystring: templateQuery } }, async (req) =>
    sampleMail(req.query.template, mailLang(req.query.locale)),
  );

  /** Отправить образец на почту владельца: проверка, что почта вообще ходит. */
  app.post<{ Body: { template: Template; locale?: string } }>('/mail/test', { schema: { body: { ...templateQuery, additionalProperties: false } } }, async (req, reply) => {
    if (!mailEnabled) return reply.code(503).send({ error: 'Почта не настроена', code: 'mail' });
    await audit(req, { action: 'mail.test', targetType: 'mail', targetId: req.body.template });
    const mail = sampleMail(req.body.template, mailLang(req.body.locale));
    await sendMail({ to: req.admin!.email, ...mail, subject: `[тест] ${mail.subject}`, tag: 'owner-test' });
    return { ok: true, to: req.admin!.email };
  });

  /**
   * Повторить письмо из журнала. Текст писем не хранится (в нём разовые ссылки), поэтому повтор — это новое письмо:
   * для сброса пароля — свежая ссылка. Остальные письма привязаны к событию (просьба, приглашение, отчёт) и не повторяются.
   */
  app.post<{ Params: { id: number } }>('/mail/:id/resend', { schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } } } }, async (req, reply) => {
    const { data: row, error } = await db().from('ig_mail_log').select('to_email, tag').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!row) return reply.code(404).send({ error: 'Письмо не найдено' });
    if (row.tag !== 'password-reset') return reply.code(409).send({ error: 'Это письмо привязано к событию и не повторяется', code: 'notResendable' });
    const { data: parent } = await db().from('ig_parents').select('id, display_name, email').eq('email', row.to_email).maybeSingle();
    if (!parent) return reply.code(404).send({ error: 'Семьи с этой почтой больше нет' });
    const { data: settings } = await db().from('ig_parent_settings').select('mail_locale').eq('parent_id', parent.id).maybeSingle();
    await audit(req, { action: 'mail.resend', targetType: 'parent', targetId: parent.id, after: { tag: row.tag } });
    const sent = await sendResetLink(parent, parent.email, mailLocale(settings?.mail_locale ?? undefined), req.log);
    return sent ? { ok: true } : reply.code(503).send({ error: 'Почта не настроена', code: 'mail' });
  });
};
