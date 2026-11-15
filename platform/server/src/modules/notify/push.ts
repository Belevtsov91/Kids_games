import type { FastifyBaseLogger } from 'fastify';
import webpush from 'web-push';
import { env } from '../../config/env.js';
import { db } from '../../db/index.js';

// Web Push взрослому: подписки браузеров в ig_push_subs, отправка через web-push (VAPID).
// Мёртвые подписки (браузер отписался, 404/410) удаляем сразу.

export const pushEnabled = Boolean(env.push.publicKey && env.push.privateKey);
if (pushEnabled) webpush.setVapidDetails(env.push.subject, env.push.publicKey!, env.push.privateKey!);

export const MAX_SUBS_PER_PARENT = 10;

export interface PushPayload {
  title: string;
  body: string;
  /** Тег: новое уведомление о той же просьбе заменяет старое. */
  tag: string;
  /** Куда открыть по нажатию (путь на сайте). */
  url: string;
  /** Кнопки прямо в уведомлении: подписанный ответ, как в письме. */
  actions?: { action: 'allow' | 'deny'; title: string; token: string }[];
  /** Что показать после ответа кнопкой: уведомление-итог на языке взрослого. */
  done?: { approved: string; denied: string; gone: string };
}

type Sender = (sub: webpush.PushSubscription, body: string) => Promise<unknown>;
let custom = false;
let sender: Sender = (sub, body) => webpush.sendNotification(sub, body, { TTL: 6 * 60 * 60, urgency: 'high' });
/** Для тестов: подменить отправку. */
export const setPushSender = (s: Sender) => {
  sender = s;
  custom = true;
};

const gone = (err: unknown) => {
  const code = (err as { statusCode?: number })?.statusCode;
  return code === 404 || code === 410;
};

/** Отправить всем браузерам взрослого. Возвращает, сколько дошло. */
export async function pushToParent(parentId: string, payload: PushPayload, log: FastifyBaseLogger): Promise<number> {
  if (!pushEnabled && !custom) return 0;
  const { data: subs, error } = await db().from('ig_push_subs').select('id, endpoint, p256dh, auth').eq('parent_id', parentId);
  if (error) throw error;
  if (!subs?.length) return 0;
  const body = JSON.stringify(payload);
  let ok = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await sender({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
        ok++;
        await db().from('ig_push_subs').update({ last_ok_at: new Date().toISOString() }).eq('id', s.id);
      } catch (err) {
        if (gone(err)) await db().from('ig_push_subs').delete().eq('id', s.id);
        else log.error({ err }, 'Не удалось отправить push');
      }
    }),
  );
  return ok;
}
