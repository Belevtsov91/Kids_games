import { createHash } from 'node:crypto';
import { db, supabase } from '../../db/index.js';
import { deviceKind } from './loginPolicy.js';

// Сбор данных для админки с основного сайта: журналы писем, ошибок, неудачных входов и задач,
// «в какой игре ребёнок сейчас», вид устройства. Главное правило: основной сайт от этого не зависит.
// Таблиц миграции 008 может не быть, БД может быть недоступна — любая ошибка здесь молча гасится,
// а вызывающий код не ждёт результата (кроме isFrozen, который при ошибке отвечает «не заморожен»).

const quiet = (work: () => PromiseLike<{ error: unknown } | void>) => {
  if (!supabase) return;
  void Promise.resolve()
    .then(work)
    .catch(() => undefined);
};

const cut = (value: string | undefined | null, max: number) => (value ?? '').slice(0, max);

/** Аккаунт заморожен владельцем (или стоит на удалении)? При любой ошибке — нет: вход не ломаем. */
export async function isFrozen(parentId: string): Promise<boolean> {
  try {
    const { data, error } = await db().from('ig_parents').select('frozen_at').eq('id', parentId).maybeSingle();
    return !error && Boolean(data?.frozen_at);
  } catch {
    return false;
  }
}

export const FROZEN = { error: 'Аккаунт временно закрыт. Напишите нам, если это ошибка', code: 'frozen' } as const;

export function logLoginFailure(email: string, known: boolean, ip: string) {
  quiet(() => db().from('ig_login_failures').insert({ email: cut(email.trim().toLowerCase(), 254), known, ip: cut(ip, 64) }));
}

export function logMail(to: string, tag: string | undefined, subject: string, ok: boolean, error?: unknown) {
  quiet(() =>
    db().from('ig_mail_log').insert({ to_email: cut(to, 254), tag: cut(tag ?? 'other', 40), subject: cut(subject, 200), ok, error: error ? cut(String((error as Error).message ?? error), 300) : null }),
  );
}

/** Ошибки группируются по источнику, месту и тексту: одна строка со счётчиком вместо тысячи одинаковых. */
export function logError(source: 'client' | 'server', path: string | undefined, message: string) {
  quiet(async () => {
    const text = cut(message, 300) || 'unknown';
    const place = cut(path, 120) || null;
    const fingerprint = createHash('sha256').update(`${source}\n${place ?? ''}\n${text}`).digest('hex');
    const now = new Date().toISOString();
    const { data, error } = await db().from('ig_error_log').select('count').eq('fingerprint', fingerprint).maybeSingle();
    if (error) return;
    if (data) await db().from('ig_error_log').update({ count: data.count + 1, last_at: now, resolved_at: null }).eq('fingerprint', fingerprint);
    else await db().from('ig_error_log').insert({ fingerprint, source, path: place, message: text });
  });
}

export function logJob(job: string, ok: boolean, note?: string, manual = false, startedAt = new Date()) {
  quiet(() => db().from('ig_job_runs').insert({ job, ok, note: note ? cut(note, 300) : null, manual, started_at: startedAt.toISOString() }));
}

/** В какой игре был последний «пульс» ребёнка — для списка «играют сейчас». */
export function noteBeat(childId: string, gameId: string) {
  quiet(() => db().from('ig_child_settings').update({ last_game: gameId }).eq('child_id', childId));
}

/** Вид устройства только что созданной сессии: телефон, планшет или компьютер. */
export function noteDevice(parentId: string, userAgent: string | undefined) {
  quiet(() => db().from('ig_sessions').update({ device: deviceKind(userAgent) }).eq('parent_id', parentId).is('device', null));
}
