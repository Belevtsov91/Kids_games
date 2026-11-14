import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../../db/index.js';
import { loadAdminSession, unseal } from './adminSession.js';
import { siteFlags } from './flags.js';
import { verifyCode } from './totp.js';

// Защита маршрутов админки: вход владельца, режим «только чтение» и подтверждение опасных действий.

/** preHandler: без сессии владельца — 401. */
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  req.admin = await loadAdminSession(req);
  if (!req.admin) return reply.code(401).send({ error: 'Нужно войти', code: 'auth' });
}

/** Пути, которые работают и в режиме «только чтение»: сам переключатель и выход. */
const READONLY_ALLOWED = [/\/site\/readonly$/, /\/auth\/logout(-all)?$/];

/** preHandler: при включённом «только чтение» любые изменения отклоняются. */
export async function blockWhenReadonly(req: FastifyRequest, reply: FastifyReply) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;
  const path = req.url.split('?')[0];
  if (READONLY_ALLOWED.some((re) => re.test(path))) return;
  if ((await siteFlags()).admin_readonly) return reply.code(423).send({ error: 'Включён режим «только чтение»', code: 'readonly' });
}

/** Поля подтверждения в теле опасного запроса: слово и код из приложения. */
export const confirmProps = {
  confirm: { type: 'string', maxLength: 20 },
  code: { type: 'string', minLength: 6, maxLength: 8 },
} as const;

export interface ConfirmBody {
  confirm?: string;
  code?: string;
}

/** Принять код из приложения один раз: шаг запоминаем, второй раз тот же код не подойдёт. */
export async function takeCode(adminId: string, code: string): Promise<boolean> {
  const { data: owner, error } = await db().from('ig_admins').select('totp_secret, totp_last_step').eq('id', adminId).single();
  if (error) throw error;
  const secret = unseal(owner.totp_secret)?.toString();
  const step = secret ? verifyCode(secret, code, Number(owner.totp_last_step)) : null;
  if (step === null) return false;
  const { data: updated, error: uError } = await db()
    .from('ig_admins')
    .update({ totp_last_step: step })
    .eq('id', adminId)
    .lt('totp_last_step', step)
    .select('id');
  if (uError) throw uError;
  return Boolean(updated?.length);
}

/**
 * Подтверждение опасного действия: слово (например, УДАЛИТЬ) и свежий код из приложения.
 * Возвращает true, если можно продолжать; иначе сам отвечает 400.
 */
export async function confirmDanger(req: FastifyRequest, reply: FastifyReply, word: string) {
  const body = (req.body ?? {}) as ConfirmBody;
  if ((body.confirm ?? '').trim().toUpperCase() !== word) {
    await reply.code(400).send({ error: 'Слово подтверждения не совпало', code: 'confirm' });
    return false;
  }
  if (!body.code || !(await takeCode(req.admin!.adminId, body.code))) {
    await reply.code(400).send({ error: 'Код не подошёл. Дождитесь нового кода в приложении', code: 'code' });
    return false;
  }
  return true;
}
