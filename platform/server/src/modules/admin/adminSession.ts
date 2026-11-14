import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../config/env.js';
import { db, supabase } from '../../db/index.js';

// Сессия владельца: отдельная cookie только для /api/admin, 8 часов. Устроена как сессия родителя:
// в cookie зашифрованный случайный токен, в БД (ig_admin_sessions) только его SHA-256.

export const ADMIN_COOKIE = 'ig_admin';
export const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;

export interface AdminSession {
  adminId: string;
  email: string;
  expiresAt: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    admin: AdminSession | null;
  }
}

const key = env.sessionEncryptionKey && /^[0-9a-f]{64}$/i.test(env.sessionEncryptionKey)
  ? Buffer.from(env.sessionEncryptionKey, 'hex')
  : null;

/** Админка включена: задан список почт, есть БД и ключ шифрования. Иначе маршрутов /api/admin нет. */
export const adminEnabled = Boolean(env.admin.emails.length && supabase && key);

export const isAdminEmail = (email: string) => env.admin.emails.includes(email.trim().toLowerCase());

export const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

/** Шифрует строку ключом сервера (AES-256-GCM): так лежит в БД секрет кода и так устроена cookie. */
export function seal(plain: Buffer | string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key!, iv);
  const data = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}

export function unseal(value: string): Buffer | null {
  try {
    const raw = Buffer.from(value, 'base64url');
    if (raw.length < 29) return null;
    const decipher = createDecipheriv('aes-256-gcm', key!, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]);
  } catch {
    return null;
  }
}

const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: env.cookieSecure, path: '/api/admin' } as const;

/** Отпечаток устройства: браузер и система из User-Agent. Не для защиты, а чтобы заметить «новое устройство». */
export const deviceHash = (req: FastifyRequest) => sha256(`${req.headers['user-agent'] ?? ''}`.slice(0, 300));

export async function createAdminSession(req: FastifyRequest, reply: FastifyReply, adminId: string) {
  const token = randomBytes(32);
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_MS);
  const { error } = await db()
    .from('ig_admin_sessions')
    .insert({ token_hash: sha256(token), admin_id: adminId, device_hash: deviceHash(req), expires_at: expiresAt.toISOString() });
  if (error) throw error;
  await db().from('ig_admin_sessions').delete().lt('expires_at', new Date().toISOString());
  reply.setCookie(ADMIN_COOKIE, seal(token), { ...cookieOptions, expires: expiresAt });
}

const tokenHashFrom = (req: FastifyRequest) => {
  const value = req.cookies[ADMIN_COOKIE];
  const token = value && key ? unseal(value) : null;
  return token && token.length === 32 ? sha256(token) : null;
};

export async function loadAdminSession(req: FastifyRequest): Promise<AdminSession | null> {
  const tokenHash = tokenHashFrom(req);
  if (!tokenHash) return null;
  const { data, error } = await db()
    .from('ig_admin_sessions')
    .select('admin_id, expires_at, ig_admins(email)')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (error) throw error;
  if (!data || new Date(data.expires_at).getTime() <= Date.now()) return null;
  const owner = data.ig_admins as unknown as { email: string } | null;
  // Почту убрали из ADMIN_EMAILS — сессия больше не действует.
  if (!owner || !isAdminEmail(owner.email)) return null;
  return { adminId: data.admin_id, email: owner.email, expiresAt: data.expires_at };
}

export async function destroyAdminSession(req: FastifyRequest, reply: FastifyReply) {
  const tokenHash = tokenHashFrom(req);
  if (tokenHash) await db().from('ig_admin_sessions').delete().eq('token_hash', tokenHash);
  reply.clearCookie(ADMIN_COOKIE, cookieOptions);
}

export async function destroyAllAdminSessions(adminId: string) {
  const { error } = await db().from('ig_admin_sessions').delete().eq('admin_id', adminId);
  if (error) throw error;
}
