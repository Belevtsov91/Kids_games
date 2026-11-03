import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { resetPasswordMail } from '../src/modules/auth/reset/email/template';
import { MAIL_LOCALES, mailLocale, RESET_MAIL_TEXT } from '../src/modules/auth/reset/email/text';
import { hashResetToken } from '../src/modules/auth/reset/reset.routes';

describe('письмо «Восстановить пароль»', () => {
  const url = 'https://example.com/reset#abc_DEF-123';

  it('есть на всех языках сайта, ссылка и срок на месте', () => {
    for (const locale of MAIL_LOCALES) {
      const mail = resetPasswordMail({ locale, name: 'Анна', url, minutes: 30 });
      expect(mail.subject).toBe(RESET_MAIL_TEXT[locale].subject);
      expect(mail.html).toContain(`href="${url}"`);
      expect(mail.html).toContain(`lang="${locale}"`);
      expect(mail.html).toContain('🐻');
      expect(mail.text).toContain(url);
      expect(mail.text).toContain('30');
    }
  });

  it('имя из БД экранируется', () => {
    const mail = resetPasswordMail({ locale: 'en', name: '<img src=x onerror=alert(1)>', url, minutes: 30 });
    expect(mail.html).not.toContain('<img src=x');
    expect(mail.html).toContain('&lt;img src=x');
  });

  it('неизвестный язык — русский', () => {
    expect(mailLocale('de')).toBe('ru');
    expect(mailLocale('uk')).toBe('uk');
  });
});

describe('токен сброса', () => {
  it('в БД хранится только SHA-256', () => {
    const hash = hashResetToken('token');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain('token');
  });
});

// Без БД (.env в тестах не читается) проверяем защитные слои.
describe('API сброса пароля без БД', async () => {
  const app = await buildApp({ logger: false });
  afterAll(() => app.close());

  it('без БД отвечает 503, а не падает', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/forgot', payload: { email: 'a@b.co', locale: 'ru' } });
    expect(res.statusCode).toBe(503);
  });

  it('с чужого сайта нельзя', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset',
      headers: { origin: 'https://evil.example' },
      payload: { token: 'x'.repeat(43), password: 'Secret-123' },
    });
    expect(res.statusCode).toBe(403);
  });
});
