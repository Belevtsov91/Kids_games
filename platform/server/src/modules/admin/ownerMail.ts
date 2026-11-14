import type { FastifyBaseLogger } from 'fastify';
import { simpleMail } from '../../mail/layout.js';
import { mailEnabled, sendMail } from '../../mail/mailer.js';

// Письма самому владельцу: вход с нового устройства и блокировка после неудачных попыток.
// Письмо не должно мешать входу: если почта не настроена или не ушло — только строка в логе.

export async function mailOwner(log: FastifyBaseLogger, to: string, subject: string, lines: string[], rows: [string, string][] = []) {
  if (!mailEnabled) return;
  try {
    const mail = simpleMail({ locale: 'ru', subject, title: subject, lines, rows, footer: 'Письмо отправлено автоматически. Если это были не вы, смените пароль админки.' });
    await sendMail({ to, ...mail, tag: 'owner-alert' });
  } catch (err) {
    log.error({ err }, 'Админка: письмо владельцу не отправлено');
  }
}
