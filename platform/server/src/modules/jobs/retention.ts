import type { FastifyBaseLogger } from 'fastify';
import { env } from '../../config/env.js';
import { db } from '../../db/index.js';
import { simpleMail } from '../../mail/layout.js';
import { mailEnabled, sendMail } from '../../mail/mailer.js';
import { mailLang } from '../../mail/texts.js';
import { INACTIVE_DAYS, inactiveStep, TRASH_DAYS, WARN_DAYS } from '../children/profileRules.js';
import { INACTIVE_MAIL } from './retentionText.js';

// Срок хранения. Данные детей не лежат бессрочно:
// профиль из корзины стирается через TRASH_DAYS дней, аккаунт, в который не входили INACTIVE_DAYS дней, —
// через WARN_DAYS после письма-предупреждения. Без письма аккаунт не удаляется никогда:
// если почта не настроена или письмо не ушло, шаг просто повторится завтра.

const DAY = 86_400_000;
/** За один запуск обрабатываем не больше стольких аккаунтов: чистка идёт каждый день. */
const BATCH = 200;

/** Стереть профили, которые пролежали в корзине дольше срока. Сохранения игр уходят каскадом. */
export async function purgeTrash(now = new Date()) {
  const before = new Date(now.getTime() - TRASH_DAYS * DAY).toISOString();
  return db().from('ig_children').delete().lt('deleted_at', before);
}

export async function sweepInactive(log: FastifyBaseLogger, now = new Date()) {
  const idleSince = new Date(now.getTime() - (INACTIVE_DAYS - WARN_DAYS) * DAY).toISOString();
  const { data: parents, error } = await db()
    .from('ig_parents')
    .select('id, email, last_seen_at, inactive_warned_at')
    .lt('last_seen_at', idleSince)
    .order('last_seen_at')
    .limit(BATCH);
  if (error) throw error;
  for (const p of parents ?? []) {
    const step = inactiveStep(p.last_seen_at, p.inactive_warned_at, now);
    if (step === 'delete') {
      const { error: dError } = await db().from('ig_parents').delete().eq('id', p.id).lt('last_seen_at', idleSince);
      if (dError) log.error({ err: dError }, 'Срок хранения: аккаунт не удалён');
      else log.info({ parentId: p.id }, 'Срок хранения: неактивный аккаунт удалён');
    } else if (step === 'warn' && mailEnabled) {
      try {
        const { data: settings } = await db().from('ig_parent_settings').select('mail_locale').eq('parent_id', p.id).maybeSingle();
        const lang = mailLang(settings?.mail_locale);
        const t = INACTIVE_MAIL[lang];
        const mail = simpleMail({ locale: lang, subject: t.subject, title: t.subject, lines: [t.line(WARN_DAYS)], buttons: [{ label: t.open, url: `${env.appUrl}/login` }], footer: t.footer });
        await sendMail({ to: p.email, ...mail, tag: 'inactive-warning' });
        await db().from('ig_parents').update({ inactive_warned_at: now.toISOString() }).eq('id', p.id);
      } catch (err) {
        log.error({ err }, 'Срок хранения: письмо-предупреждение не отправлено');
      }
    }
  }
}
