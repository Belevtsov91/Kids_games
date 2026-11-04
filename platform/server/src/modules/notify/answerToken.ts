import { createHmac, timingSafeEqual } from 'node:crypto';

// Кнопки «Разрешить» / «Не сегодня» в письме: подписанный токен «какая просьба, какой ответ, до когда».
// Подделать без ключа сервера нельзя; срок — до конца суток просьбы с запасом (24 часа).

const TTL_MS = 24 * 60 * 60 * 1000;

const sign = (secret: string, payload: string) => createHmac('sha256', secret).update(payload).digest('base64url');

export function answerToken(secret: string, requestId: string, approve: boolean, now = Date.now()) {
  const payload = `${requestId}.${approve ? 1 : 0}.${now + TTL_MS}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(secret, payload)}`;
}

export function readAnswerToken(secret: string, token: string, now = Date.now()): { requestId: string; approve: boolean } | null {
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const payload = Buffer.from(body, 'base64url').toString();
  const expected = Buffer.from(sign(secret, payload));
  const got = Buffer.from(mac);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  const [requestId, approve, until] = payload.split('.');
  if (!/^[0-9a-f-]{36}$/i.test(requestId) || Number(until) < now) return null;
  return { requestId, approve: approve === '1' };
}
