import type { FastifyReply, FastifyRequest } from 'fastify';
import { settingsOf, timeOf, zoneOf } from '../kid/childData.js';
import { parentStatus } from '../parent/parentSession.js';

// Смена профиля ребёнка. Пока у текущего ребёнка кончилось время или идут тихие часы,
// выбрать другого ребёнка (или завести нового) можно только с открытым кабинетом родителя.
// Иначе ребёнок обходит свой лимит, просто нажав на профиль брата или сестры.

/** Почему текущему ребёнку сейчас нельзя играть; null — можно. */
export async function activeChildBlocked(req: FastifyRequest): Promise<'quiet' | 'limit' | null> {
  const session = req.session;
  if (!session?.activeChildId) return null;
  const [settings, zone] = await Promise.all([settingsOf(session.activeChildId), zoneOf(session.parentId)]);
  const time = await timeOf(session.activeChildId, settings, zone);
  return time.blocked;
}

/**
 * Проверка перед сменой профиля. `targetId` — кого выбирают (null — новый профиль).
 * Отвечает 423 { locked: true, reason } и возвращает false, если нужен взрослый.
 */
export async function guardSwitch(req: FastifyRequest, reply: FastifyReply, targetId: string | null) {
  if (targetId && targetId === req.session?.activeChildId) return true;
  const blocked = await activeChildBlocked(req);
  if (!blocked || (await parentStatus(req))) return true;
  await reply.code(423).send({ error: 'Сменить профиль может только взрослый', locked: true, reason: blocked });
  return false;
}
