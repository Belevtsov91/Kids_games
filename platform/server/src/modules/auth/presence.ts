import type { FastifyRequest } from 'fastify';
import { db } from '../../db/index.js';
import { tokenHashFrom } from './session.js';

// «Когда взрослый был здесь последний раз» и согласие при регистрации.

/** Редакция политики конфиденциальности, с которой соглашается взрослый при регистрации. Менять вместе с текстом политики. */
export const POLICY_VERSION = '2026-11-13';

const DAY = 86_400_000;

/**
 * Отметка «аккаунтом пользуются» не чаще раза в сутки: по ней считается срок хранения неактивных аккаунтов.
 * Заодно снимает предупреждение о скором удалении.
 */
export async function touchParent(parentId: string, lastSeenAt: string | null | undefined, now = new Date()) {
  if (lastSeenAt && now.getTime() - new Date(lastSeenAt).getTime() < DAY) return;
  const { error } = await db().from('ig_parents').update({ last_seen_at: now.toISOString(), inactive_warned_at: null }).eq('id', parentId);
  if (error) throw error;
}

/** Когда на этом устройстве последний раз выбирали профиль ребёнка. */
export async function childSeenAt(req: FastifyRequest): Promise<string | null> {
  const tokenHash = tokenHashFrom(req);
  if (!tokenHash) return null;
  const { data, error } = await db().from('ig_sessions').select('child_seen_at').eq('token_hash', tokenHash).maybeSingle();
  if (error) throw error;
  return data?.child_seen_at ?? null;
}
