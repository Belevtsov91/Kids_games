import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PlayerSession } from '@ig/sdk/server';
import { env } from '../../config/env.js';
import { supabase } from '../../db/index.js';

// Серверная сессия. Браузер получает одну httpOnly-cookie: зашифрованный случайный токен,
// без данных о пользователе. В БД (ig_sessions) лежит только SHA-256 токена.

export const SESSION_COOKIE = 'ig_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Форма сессии — общий контракт с играми (`@ig/sdk/server`). */
export type Session = PlayerSession;

declare module 'fastify' {
  interface FastifyRequest {
    session: Session | null;
  }
}

const key = env.sessionEncryptionKey && /^[0-9a-f]{64}$/i.test(env.sessionEncryptionKey)
  ? Buffer.from(env.sessionEncryptionKey, 'hex')
  : null;

/** Сессии работают, только если есть и БД, и ключ шифрования. */
export const sessionsEnabled = Boolean(supabase && key);

const hashToken = (token: Buffer) => createHash('sha256').update(token).digest('hex');

// AES-256-GCM: cookie нельзя ни прочитать, ни подделать без ключа сервера.
function encrypt(token: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key!, iv);
  const data = Buffer.concat([cipher.update(token), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}

function decrypt(value: string): Buffer | null {
  try {
    const raw = Buffer.from(value, 'base64url');
    if (raw.length !== 12 + 16 + 32) return null;
    const decipher = createDecipheriv('aes-256-gcm', key!, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]);
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: env.cookieSecure,
  path: '/api',
} as const;

export async function createSession(reply: FastifyReply, parentId: string) {
  const token = randomBytes(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const { error } = await supabase!
    .from('ig_sessions')
    .insert({ token_hash: hashToken(token), parent_id: parentId, expires_at: expiresAt.toISOString() });
  if (error) throw error;
  // Заодно чистим просроченные сессии этого родителя.
  await supabase!.from('ig_sessions').delete().eq('parent_id', parentId).lt('expires_at', new Date().toISOString());
  reply.setCookie(SESSION_COOKIE, encrypt(token), { ...cookieOptions, expires: expiresAt });
}

function tokenHashFrom(req: FastifyRequest) {
  const value = req.cookies[SESSION_COOKIE];
  const token = value && key ? decrypt(value) : null;
  return token ? hashToken(token) : null;
}

/** Читает сессию из cookie и БД. Вызывается хуком на каждый запрос к /api. */
export async function loadSession(req: FastifyRequest): Promise<Session | null> {
  const tokenHash = sessionsEnabled ? tokenHashFrom(req) : null;
  if (!tokenHash) return null;
  const { data, error } = await supabase!
    .from('ig_sessions')
    .select('parent_id, active_child_id, expires_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (error) throw error;
  if (!data || new Date(data.expires_at).getTime() <= Date.now()) return null;
  return { parentId: data.parent_id, activeChildId: data.active_child_id };
}

export async function setActiveChild(req: FastifyRequest, childId: string | null) {
  const tokenHash = tokenHashFrom(req);
  if (!tokenHash) return;
  const { error } = await supabase!.from('ig_sessions').update({ active_child_id: childId }).eq('token_hash', tokenHash);
  if (error) throw error;
}

export async function destroySession(req: FastifyRequest, reply: FastifyReply) {
  const tokenHash = tokenHashFrom(req);
  if (tokenHash) await supabase!.from('ig_sessions').delete().eq('token_hash', tokenHash);
  reply.clearCookie(SESSION_COOKIE, cookieOptions);
}

/** preHandler для закрытых маршрутов. */
export async function requireSession(req: FastifyRequest, reply: FastifyReply) {
  if (!req.session) return reply.code(401).send({ error: 'Нужно войти' });
}
