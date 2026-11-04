import type { KidStatus } from './KidStatus';

// Без сети сервер не считает время, поэтому таймер ведёт оболочка сама: от последнего ответа
// сервера прибавляет сыгранные секунды и сама включает «время вышло» и тихие часы.
// Когда сеть вернётся, накопленные секунды уходят серверу с ближайшим пульсом (поле offline).

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Тихие часы по часам устройства (интервал может идти через полночь). */
export function quietNow(rules: KidStatus['rules'], minutes: number) {
  if (!rules.quietFrom || !rules.quietTo) return false;
  const from = toMin(rules.quietFrom), to = toMin(rules.quietTo);
  if (from === to) return false;
  return from < to ? minutes >= from && minutes < to : minutes >= from || minutes < to;
}

/** Статус «как посчитал бы сервер»: последний ответ сервера + offlineSeconds сыгранного без сети. */
export function applyOffline(base: KidStatus, offlineSeconds: number, now = new Date()): KidStatus {
  const usedMinutes = base.time.usedMinutes + Math.floor(offlineSeconds / 60);
  const remaining = base.time.limit === null ? null : Math.max(0, base.time.limit - usedMinutes);
  const quiet = quietNow(base.rules, now.getHours() * 60 + now.getMinutes());
  return {
    ...base,
    time: {
      ...base.time,
      usedMinutes,
      remaining,
      blocked: quiet ? 'quiet' : remaining === 0 ? 'limit' : null,
      quietTo: quiet ? base.rules.quietTo : null,
    },
  };
}

/** Секунды, сыгранные без сети и ещё не отправленные серверу. Общие для всех игр за визит. */
let pending = 0;
export const offlineSeconds = {
  get: () => pending,
  add: (seconds: number) => void (pending = Math.min(pending + seconds, 4 * 3600)),
  /** Сервер принял: сбросить. */
  clear: () => void (pending = 0),
};
