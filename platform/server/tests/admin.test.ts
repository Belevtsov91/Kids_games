import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { changePct, daysBack, maskEmail, tally } from '../src/modules/admin/data';
import { afterFailure, deviceKind, deviceLabel, isLocked, LOCK_MS, MAX_FAILED } from '../src/modules/admin/loginPolicy';
import { alertStep, jobHealth, type JobRun } from '../src/modules/admin/healthRules';
import { toCsv } from '../src/modules/admin/logs.routes';
import { sampleMail } from '../src/modules/admin/mail.routes';
import { base32Decode, base32Encode, codeAt, newSecret, otpauthUri, stepAt, verifyCode } from '../src/modules/admin/totp';

describe('код из приложения (TOTP)', () => {
  // Проверочные значения из RFC 6238 (SHA-1, секрет «12345678901234567890»), последние 6 цифр.
  const secret = base32Encode(Buffer.from('12345678901234567890'));

  it('совпадает с RFC 6238', () => {
    expect(codeAt(secret, Math.floor(59 / 30))).toBe('287082');
    expect(codeAt(secret, Math.floor(1111111109 / 30))).toBe('081804');
    expect(codeAt(secret, Math.floor(2000000000 / 30))).toBe('279037');
  });

  it('base32 туда и обратно', () => {
    const fresh = newSecret();
    expect(fresh).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Encode(base32Decode(fresh))).toBe(fresh);
  });

  it('принимает текущий и соседние шаги, чужой код не принимает', () => {
    const now = new Date('2026-11-14T10:00:10Z');
    const step = stepAt(now);
    expect(verifyCode(secret, codeAt(secret, step), 0, now)).toBe(step);
    expect(verifyCode(secret, codeAt(secret, step - 1), 0, now)).toBe(step - 1);
    expect(verifyCode(secret, codeAt(secret, step + 1), 0, now)).toBe(step + 1);
    expect(verifyCode(secret, codeAt(secret, step - 2), 0, now)).toBeNull();
    expect(verifyCode(secret, '12345', 0, now)).toBeNull();
  });

  it('один код дважды не срабатывает', () => {
    const now = new Date('2026-11-14T10:00:10Z');
    const step = stepAt(now);
    expect(verifyCode(secret, codeAt(secret, step), step, now)).toBeNull();
    expect(verifyCode(secret, codeAt(secret, step - 1), step, now)).toBeNull();
  });

  it('ссылка для приложения без названия проекта', () => {
    const uri = otpauthUri('owner@example.com', secret);
    expect(uri).toContain('secret=' + secret);
    expect(uri.toLowerCase()).not.toContain('interact');
  });
});

describe('вход владельца', () => {
  it('пятая неудача блокирует на 15 минут', () => {
    const now = new Date('2026-11-14T10:00:00Z');
    expect(afterFailure(0, now)).toEqual({ failed: 1, lockedUntil: null, justLocked: false });
    const fifth = afterFailure(MAX_FAILED - 1, now);
    expect(fifth.justLocked).toBe(true);
    expect(new Date(fifth.lockedUntil!).getTime()).toBe(now.getTime() + LOCK_MS);
    expect(isLocked(fifth.lockedUntil, now)).toBe(true);
    expect(isLocked(fifth.lockedUntil, new Date(now.getTime() + LOCK_MS + 1))).toBe(false);
    expect(isLocked(null)).toBe(false);
  });

  it('устройство по User-Agent', () => {
    const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
    const windows = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36';
    const tablet = 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36';
    expect(deviceKind(iphone)).toBe('phone');
    expect(deviceKind(windows)).toBe('desktop');
    expect(deviceKind(tablet)).toBe('tablet');
    expect(deviceLabel(windows)).toBe('Chrome, Windows');
    expect(deviceLabel(iphone)).toBe('Safari, iOS');
  });
});

describe('помощники сводки', () => {
  it('почта скрыта', () => {
    expect(maskEmail('vitalii@example.com')).toBe('v***@example.com');
    expect(maskEmail('bad')).toBe('***');
  });

  it('дни подряд и проценты', () => {
    expect(daysBack('2026-11-14', 3)).toEqual(['2026-11-12', '2026-11-13', '2026-11-14']);
    expect(daysBack('2026-03-01', 2)).toEqual(['2026-02-28', '2026-03-01']);
    expect(changePct(112, 100)).toBe(12);
    expect(changePct(5, 0)).toBeNull();
    expect(tally(['ru', 'uk', 'ru', null], (x) => x)).toEqual({ ru: 2, uk: 1, unknown: 1 });
  });
});

describe('здоровье и журналы', () => {
  const now = new Date('2026-11-14T12:00:00Z');
  const run = (job: string, hoursAgo: number, ok = true): JobRun => ({ job, ok, note: ok ? null : 'boom', manual: false, started_at: new Date(now.getTime() - hoursAgo * 3_600_000).toISOString() });

  it('задача жива, если шла недавно и без сбоя', () => {
    const jobs = jobHealth([run('cleanup', 5), run('weekly-report', 1), run('digest', 40)], now);
    expect(jobs.find((j) => j.job === 'cleanup')?.ok).toBe(true);
    expect(jobs.find((j) => j.job === 'weekly-report')?.ok).toBe(true);
    expect(jobs.find((j) => j.job === 'digest')?.ok).toBe(false);
    expect(jobHealth([], now).every((j) => !j.ok && j.lastAt === null)).toBe(true);
    expect(jobHealth([run('cleanup', 1, false)], now).find((j) => j.job === 'cleanup')?.note).toContain('boom');
  });

  it('тревога после второго сбоя подряд, один раз, и «починилось» после тревоги', () => {
    const ok = { ok: true, alerted: false }, bad = { ok: false, alerted: false }, told = { ok: false, alerted: true };
    expect(alertStep(false, [ok])).toBeNull();
    expect(alertStep(false, [bad, ok])).toBe('alert');
    expect(alertStep(false, [bad, told, bad, ok])).toBeNull();
    expect(alertStep(true, [bad, told, bad, ok])).toBe('recovered');
    expect(alertStep(true, [bad, ok])).toBeNull();
    expect(alertStep(true, [ok])).toBeNull();
    expect(alertStep(false, [])).toBeNull();
  });

  it('CSV: кавычки, точка с запятой и защита от формул', () => {
    const csv = toCsv([{ a: 'x;"y"', b: '=1+1', c: { k: 1 } }], ['a', 'b', 'c']);
    expect(csv).toContain('"x;""y"""');
    expect(csv).toContain(`"'=1+1"`);
    expect(csv).toContain('"{""k"":1}"');
  });

  it('письма-образцы есть на всех языках и без настоящих данных', () => {
    for (const lang of ['ru', 'uk', 'ro', 'en'] as const) {
      for (const template of ['password-reset', 'time-request', 'weekly-report', 'helper-invite', 'inactive-warning'] as const) {
        const mail = sampleMail(template, lang);
        expect(mail.subject.length).toBeGreaterThan(3);
        expect(mail.html).toContain('#sample');
      }
    }
  });
});

describe('без ADMIN_EMAILS админки нет', () => {
  it('маршруты /api/admin отвечают 404, основной сайт работает', async () => {
    const app = await buildApp({ logger: false, gamesDir: '/nonexistent' });
    expect((await app.inject({ method: 'GET', url: '/api/admin/auth/me' })).statusCode).toBe(404);
    expect((await app.inject({ method: 'POST', url: '/api/admin/auth/login', payload: {} })).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: '/api/health' })).statusCode).toBe(200);
    // Без БД и миграции 008 основной сайт получает «всё как обычно».
    const site = await app.inject({ method: 'GET', url: '/api/site' });
    expect(site.json()).toEqual({ maintenance: false, banner: {}, disabledGames: [] });
    expect((await app.inject({ method: 'GET', url: '/api/site/news' })).json()).toEqual([]);
    await app.close();
  });
});
