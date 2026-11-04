import type { FastifyReply, FastifyRequest } from 'fastify';
import { rulesOf, settingsOf, timeOf, zoneOf } from '../kid/childData.js';
import { parentStatus, takeSwitchOnce } from '../parent/parentSession.js';

// Смена профиля ребёнка и новый профиль. Если у текущего ребёнка есть правила времени
// (лимит или тихие часы), сменить профиль можно только со взрослым: открытый кабинет
// или разовое разрешение после задачи для взрослых (purpose: 'switch').
// Иначе ребёнок за минуту до конца своего лимита уходит в профиль брата или сестры
// (или заводит новый, без лимита) и играет дальше.

export type SwitchReason = 'quiet' | 'limit' | 'rules';

/** Почему текущему ребёнку нужен взрослый для смены профиля; null — не нужен. */
export async function switchNeedsAdult(req: FastifyRequest): Promise<SwitchReason | null> {
  const session = req.session;
  if (!session?.activeChildId) return null;
  const [settings, zone] = await Promise.all([settingsOf(session.activeChildId), zoneOf(session.parentId)]);
  const time = await timeOf(session.activeChildId, settings, zone);
  if (time.blocked) return time.blocked;
  const rules = rulesOf(settings);
  const hasRules = time.limit !== null || Boolean(rules.quietFrom && rules.quietTo);
  return hasRules ? 'rules' : null;
}

/**
 * Проверка перед сменой профиля. `targetId` — кого выбирают (null — новый профиль).
 * Отвечает 423 { locked: true, reason } и возвращает false, если нужен взрослый.
 */
export async function guardSwitch(req: FastifyRequest, reply: FastifyReply, targetId: string | null) {
  if (targetId && targetId === req.session?.activeChildId) return true;
  const reason = await switchNeedsAdult(req);
  if (!reason || (await parentStatus(req)) || (await takeSwitchOnce(req))) return true;
  await reply.code(423).send({ error: 'Сменить профиль может только взрослый', locked: true, reason });
  return false;
}
