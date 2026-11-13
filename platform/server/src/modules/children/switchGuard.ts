import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../../db/index.js';
import { rulesOf, settingsOf, timeOf, zoneOf } from '../kid/childData.js';
import { parentStatus, takeSwitchOnce } from '../parent/parentSession.js';
import { switchReason, type SwitchReason } from './profileRules.js';

// Смена профиля ребёнка и новый профиль. Взрослый нужен, если у текущего ребёнка есть правила времени
// или замок на выход, если выбирают защищённый профиль и если создают новый (кроме самого первого).
// «Со взрослым» — открытый кабинет или разовое разрешение после задачи для взрослых (purpose: 'switch').

export type { SwitchReason };

async function leavingOf(req: FastifyRequest) {
  const session = req.session;
  if (!session?.activeChildId) return null;
  const [settings, zone] = await Promise.all([settingsOf(session.activeChildId), zoneOf(session.parentId)]);
  const time = await timeOf(session.activeChildId, settings, zone);
  const rules = rulesOf(settings);
  return {
    blocked: time.blocked,
    hasRules: time.limit !== null || Boolean(rules.quietFrom && rules.quietTo),
    exitLock: settings?.exit_lock ?? false,
  };
}

/** Сколько профилей в семье, не считая корзину. */
export async function childCount(parentId: string) {
  const { count, error } = await db()
    .from('ig_children')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', parentId)
    .is('deleted_at', null);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Проверка перед сменой профиля. `targetId` — кого выбирают (null — новый профиль).
 * Отвечает 423 { locked: true, reason } и возвращает false, если нужен взрослый.
 */
export async function guardSwitch(req: FastifyRequest, reply: FastifyReply, targetId: string | null) {
  if (targetId && targetId === req.session?.activeChildId) return true;
  const [leaving, target, count] = await Promise.all([
    leavingOf(req),
    targetId ? settingsOf(targetId).then((s) => ({ locked: s?.locked ?? false })) : ('new' as const),
    targetId ? 1 : childCount(req.session!.parentId),
  ]);
  const reason = switchReason({ leaving, target, childCount: count });
  if (!reason || (await parentStatus(req)) || (await takeSwitchOnce(req))) return true;
  await reply.code(423).send({ error: 'Нужен взрослый', locked: true, reason });
  return false;
}
