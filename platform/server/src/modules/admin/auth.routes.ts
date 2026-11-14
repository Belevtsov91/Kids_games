import { timingSafeEqual } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env.js';
import { db } from '../../db/index.js';
import { DUMMY_HASH, hashPassword, isWeakPassword, verifyPassword, WEAK_PASSWORD } from '../auth/password.js';
import { createAdminSession, destroyAdminSession, destroyAllAdminSessions, deviceHash, isAdminEmail, loadAdminSession, seal, unseal } from './adminSession.js';
import { audit } from './audit.js';
import { siteFlags } from './flags.js';
import { afterFailure, deviceLabel, isLocked } from './loginPolicy.js';
import { mailOwner } from './ownerMail.js';
import { newSecret, otpauthUri, verifyCode } from './totp.js';

// Вход владельца: почта из ADMIN_EMAILS, свой пароль и код из приложения. Ответы на ошибки одинаковые,
// чтобы по ним нельзя было узнать, какая почта принадлежит владельцу.

const email = { type: 'string', format: 'email', maxLength: 254 } as const;
const code = { type: 'string', minLength: 6, maxLength: 8 } as const;
const strict = { rateLimit: { max: 10, timeWindow: '15 minutes' } };
const WRONG = { error: 'Неверные данные', code: 'wrong' } as const;

const setupBody = {
  type: 'object',
  required: ['email', 'token', 'password'],
  properties: { email, token: { type: 'string', maxLength: 200 }, password: { type: 'string', minLength: 12, maxLength: 72 } },
  additionalProperties: false,
} as const;
const confirmBody = {
  type: 'object',
  required: ['email', 'token', 'code'],
  properties: { email, token: { type: 'string', maxLength: 200 }, code },
  additionalProperties: false,
} as const;
const loginBody = {
  type: 'object',
  required: ['email', 'password', 'code'],
  properties: { email, password: { type: 'string', minLength: 1, maxLength: 72 }, code },
  additionalProperties: false,
} as const;

const sameToken = (given: string) => {
  const expected = env.admin.setupToken;
  if (!expected || expected.length < 16) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

const norm = (value: string) => value.trim().toLowerCase();

export const adminAuthRoutes: FastifyPluginAsync = async (app) => {
  /** Кто вошёл и сколько ещё живёт сессия. */
  app.get('/me', async (req, reply) => {
    const session = await loadAdminSession(req);
    if (!session) return reply.code(401).send({ error: 'Нужно войти', code: 'auth' });
    return { email: session.email, expiresAt: session.expiresAt, readonly: (await siteFlags()).admin_readonly };
  });

  /**
   * Первая настройка (или сброс при потере телефона): по разовому ADMIN_SETUP_TOKEN задаём пароль
   * и получаем секрет для приложения. Вход заработает только после подтверждения кодом.
   */
  app.post<{ Body: { email: string; token: string; password: string } }>('/setup', { schema: { body: setupBody }, config: strict }, async (req, reply) => {
    const address = norm(req.body.email);
    if (!isAdminEmail(address) || !sameToken(req.body.token)) return reply.code(403).send(WRONG);
    if (isWeakPassword(req.body.password, address)) return reply.code(400).send(WEAK_PASSWORD);
    const secret = newSecret();
    const { error } = await db().from('ig_admins').upsert(
      { email: address, password_hash: await hashPassword(req.body.password), totp_secret: seal(secret), totp_confirmed: false, totp_last_step: 0, failed: 0, locked_until: null },
      { onConflict: 'email' },
    );
    if (error) throw error;
    return { secret, uri: otpauthUri(address, secret) };
  });

  app.post<{ Body: { email: string; token: string; code: string } }>('/setup/confirm', { schema: { body: confirmBody }, config: strict }, async (req, reply) => {
    const address = norm(req.body.email);
    if (!isAdminEmail(address) || !sameToken(req.body.token)) return reply.code(403).send(WRONG);
    const { data: owner, error } = await db().from('ig_admins').select('id, totp_secret').eq('email', address).maybeSingle();
    if (error) throw error;
    const secret = owner ? unseal(owner.totp_secret)?.toString() : null;
    const step = secret ? verifyCode(secret, req.body.code, 0) : null;
    if (!owner || step === null) return reply.code(400).send({ error: 'Код не подошёл', code: 'code' });
    const { error: uError } = await db().from('ig_admins').update({ totp_confirmed: true, totp_last_step: step }).eq('id', owner.id);
    if (uError) throw uError;
    // Старые сессии после смены пароля и секрета больше не действуют.
    await destroyAllAdminSessions(owner.id);
    return { ok: true };
  });

  app.post<{ Body: { email: string; password: string; code: string } }>('/login', { schema: { body: loginBody }, config: strict }, async (req, reply) => {
    const address = norm(req.body.email);
    const { data: owner, error } = isAdminEmail(address)
      ? await db().from('ig_admins').select('id, password_hash, totp_secret, totp_confirmed, totp_last_step, failed, locked_until').eq('email', address).maybeSingle()
      : { data: null, error: null };
    if (error) throw error;
    const passwordOk = await verifyPassword(req.body.password, owner?.password_hash ?? DUMMY_HASH);
    if (!owner || !owner.totp_confirmed) return reply.code(401).send(WRONG);
    if (isLocked(owner.locked_until)) return reply.code(429).send({ error: 'Слишком много попыток. Попробуйте через 15 минут', code: 'locked' });

    const secret = unseal(owner.totp_secret)?.toString();
    const step = passwordOk && secret ? verifyCode(secret, req.body.code, Number(owner.totp_last_step)) : null;
    if (step === null) {
      const next = afterFailure(owner.failed);
      await db().from('ig_admins').update({ failed: next.failed, locked_until: next.lockedUntil }).eq('id', owner.id);
      if (next.justLocked) {
        void mailOwner(req.log, address, 'Вход в админку заблокирован на 15 минут', ['Пять неудачных попыток входа подряд.'], [['Устройство', deviceLabel(req.headers['user-agent'])], ['Адрес', req.ip]]);
      }
      return reply.code(401).send(WRONG);
    }

    const now = new Date().toISOString();
    const { error: uError } = await db().from('ig_admins').update({ totp_last_step: step, failed: 0, locked_until: null, last_login_at: now }).eq('id', owner.id);
    if (uError) throw uError;
    await createAdminSession(req, reply, owner.id);

    const hash = deviceHash(req);
    const label = deviceLabel(req.headers['user-agent']);
    const { data: known } = await db().from('ig_admin_devices').select('device_hash').eq('admin_id', owner.id).eq('device_hash', hash).maybeSingle();
    await db().from('ig_admin_devices').upsert({ admin_id: owner.id, device_hash: hash, label, last_seen_at: now });
    if (!known) void mailOwner(req.log, address, 'Вход в админку с нового устройства', ['Если это были вы, ничего делать не нужно.'], [['Устройство', label], ['Адрес', req.ip]]);

    req.admin = { adminId: owner.id, email: address, expiresAt: now };
    await audit(req, { action: 'admin.login', targetType: 'admin', after: { device: label, newDevice: !known } });
    return { ok: true };
  });

  app.post('/logout', async (req, reply) => {
    await destroyAdminSession(req, reply);
    return reply.code(204).send();
  });

  /** Выйти со всех устройств. */
  app.post('/logout-all', async (req, reply) => {
    const session = await loadAdminSession(req);
    if (!session) return reply.code(401).send({ error: 'Нужно войти', code: 'auth' });
    await destroyAllAdminSessions(session.adminId);
    await destroyAdminSession(req, reply);
    return reply.code(204).send();
  });
};
