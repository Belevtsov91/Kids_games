import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../../db/index.js';
import { tokenHashFrom } from '../auth/session.js';

// «Кабинет открыт»: срок в серверной сессии (ig_sessions.parent_unlocked_until).
// Каждый запрос кабинета продлевает срок; без действий кабинет закрывается сам.

export const UNLOCK_MS = 15 * 60 * 1000;

async function unlockedUntil(req: FastifyRequest): Promise<Date | null> {
  const tokenHash = tokenHashFrom(req);
  if (!tokenHash) return null;
  const { data, error } = await db().from('ig_sessions').select('parent_unlocked_until').eq('token_hash', tokenHash).maybeSingle();
  if (error) throw error;
  return data?.parent_unlocked_until ? new Date(data.parent_unlocked_until) : null;
}

export async function setUnlocked(req: FastifyRequest, until: Date | null) {
  const tokenHash = tokenHashFrom(req);
  if (!tokenHash) return;
  const { error } = await db()
    .from('ig_sessions')
    .update({ parent_unlocked_until: until?.toISOString() ?? null })
    .eq('token_hash', tokenHash);
  if (error) throw error;
}

/** Разовое разрешение взрослого на смену профиля (задача с purpose: 'switch'). Живёт минуту. */
export const SWITCH_MS = 60 * 1000;

export async function allowSwitchOnce(req: FastifyRequest) {
  const tokenHash = tokenHashFrom(req);
  if (!tokenHash) return;
  const { error } = await db()
    .from('ig_sessions')
    .update({ switch_allowed_until: new Date(Date.now() + SWITCH_MS).toISOString() })
    .eq('token_hash', tokenHash);
  if (error) throw error;
}

/** Забирает разовое разрешение: true, если оно было и не истекло. Второй раз не сработает. */
export async function takeSwitchOnce(req: FastifyRequest) {
  const tokenHash = tokenHashFrom(req);
  if (!tokenHash) return false;
  const { data, error } = await db()
    .from('ig_sessions')
    .update({ switch_allowed_until: null })
    .eq('token_hash', tokenHash)
    .gt('switch_allowed_until', new Date().toISOString())
    .select('token_hash');
  if (error) throw error;
  return Boolean(data?.length);
}

export async function parentStatus(req: FastifyRequest) {
  const until = await unlockedUntil(req);
  return until && until.getTime() > Date.now() ? until : null;
}

/** preHandler маршрутов, где нужен вход (без открытого кабинета). */
export async function requireLogin(req: FastifyRequest, reply: FastifyReply) {
  if (!req.session) return reply.code(401).send({ error: 'Нужно войти' });
}

/** preHandler кабинета: 401 — не вошёл, 423 — кабинет закрыт (нужна задача и PIN). */
export async function requireParent(req: FastifyRequest, reply: FastifyReply) {
  if (!req.session) return reply.code(401).send({ error: 'Нужно войти' });
  if (!(await parentStatus(req))) return reply.code(423).send({ error: 'Кабинет родителя закрыт', locked: true });
  await setUnlocked(req, new Date(Date.now() + UNLOCK_MS));
}

/** Ребёнок принадлежит этому родителю? parent_id только из сессии. */
export async function ownsChild(parentId: string, childId: string) {
  const { data, error } = await db().from('ig_children').select('id').eq('id', childId).eq('parent_id', parentId).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
