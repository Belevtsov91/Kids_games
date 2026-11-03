import type { KidStatus } from './KidStatus';

// Время ребёнка для запущенной игры (sdk.time). KidStatusProvider кладёт сюда каждый ответ сервера,
// а игра получает «скоро конец» за ENDING_MIN минут до лимита или до тихих часов — один раз за запуск.

export const ENDING_MIN = 2;

const listeners = new Set<(minutesLeft: number) => void>();
let last: KidStatus | null = null;
let fired = false;

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Сколько минут до конца игры сегодня: меньшее из «осталось по лимиту» и «до тихих часов»; null — без конца. */
export function minutesLeft(status: KidStatus | null, now = new Date()): number | null {
  if (!status) return null;
  if (status.time.blocked) return 0;
  const byLimit = status.time.remaining;
  const from = status.rules.quietFrom;
  const byQuiet = from && status.rules.quietTo ? (toMin(from) - (now.getHours() * 60 + now.getMinutes()) + 1440) % 1440 : null;
  if (byLimit === null) return byQuiet;
  return byQuiet === null ? byLimit : Math.min(byLimit, byQuiet);
}

function check() {
  const left = minutesLeft(last);
  if (left === null || left > ENDING_MIN || fired) return;
  fired = true;
  listeners.forEach((listener) => listener(left));
}

setInterval(check, 15_000);

export const timeBus = {
  update(status: KidStatus | null) {
    last = status;
    check();
  },
  get remaining() {
    return minutesLeft(last);
  },
  /** Новая игра — новое предупреждение. */
  reset() {
    fired = false;
  },
  onEnding(listener: (minutesLeft: number) => void) {
    listeners.add(listener);
    queueMicrotask(check);
    return () => void listeners.delete(listener);
  },
};
