import type { FastifyBaseLogger } from 'fastify';
import { db } from '../../db/index.js';
import { purgeTrash, sweepInactive } from './retention.js';

// Чистка раз в сутки: просроченные сессии и ссылки сброса пароля (раньше удалялись, только когда
// тот же родитель входил снова), старые события игр — таблица ig_play_events растёт на каждый ответ ребёнка,
// профили из корзины и давно неактивные аккаунты (retention.ts).

/** Сколько дней храним события игр (навыки считаются по последним неделям). */
export const EVENTS_KEEP_DAYS = 180;

export async function cleanup(log: FastifyBaseLogger, now = new Date()) {
  const iso = now.toISOString();
  const eventsBefore = new Date(now.getTime() - EVENTS_KEEP_DAYS * 86_400_000).toISOString();
  const steps = [
    db().from('ig_sessions').delete().lt('expires_at', iso),
    db().from('ig_password_resets').delete().lt('expires_at', iso),
    db().from('ig_play_events').delete().lt('created_at', eventsBefore),
    purgeTrash(now),
  ];
  const results = await Promise.all(steps);
  for (const { error } of results) if (error) log.error({ err: error }, 'Чистка БД: шаг не удался');
  await sweepInactive(log, now).catch((err) => log.error({ err }, 'Чистка БД: срок хранения аккаунтов не проверен'));
}

const DAY = 24 * 60 * 60 * 1000;

/** Чистка в самом сервере раз в сутки (если сервер не засыпает). Возвращает функцию остановки. */
export function startCleanup(log: FastifyBaseLogger) {
  const run = () => void cleanup(log).catch((err) => log.error({ err }, 'Чистка БД не удалась'));
  const id = setInterval(run, DAY);
  setTimeout(run, 5 * 60_000);
  return () => clearInterval(id);
}
