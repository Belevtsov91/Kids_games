// Будильник для сервера. Сервер на бесплатном хостинге засыпает, когда долго нет гостей,
// и просыпается до минуты. Пока он не ответил на /health, поверх сайта спит мишка (см. WakeGate).
//
// Фазы: checking — первый вопрос серверу, ничего не показываем (вдруг он и так не спит);
// asleep — сервер молчит, мишка спит и потихоньку встаёт; awake — сервер ответил, мишка
// доигрывает подъём; up — всё работает, мишки нет.

export type WakePhase = 'checking' | 'asleep' | 'awake' | 'up';
/** start — человек только зашёл на сайт; lost — сервер упал посреди игры. */
export type WakeReason = 'start' | 'lost';

export interface WakeState {
  phase: WakePhase;
  reason: WakeReason;
  /** Когда мишка уснул (performance.now()), чтобы подъём шёл по времени. */
  since: number;
}

const HEALTH_URL = `${import.meta.env.VITE_API_URL ?? '/api'}/health`;
/** Ответ быстрее этого — сервер не спал, мишку не показываем вовсе. */
export const SHOW_AFTER_MS = 1000;
/** Сервер ответил вскоре после того, как появился мишка: не тянем, убираем экран сразу, без подъёма. */
export const QUICK_MS = 2000;
/** Сколько ждать один ответ: спящий сервер держит запрос, пока не проснётся. */
const ATTEMPT_MS = 25_000;
const RETRY_MIN_MS = 1000;
const RETRY_MAX_MS = 3000;

let state: WakeState = { phase: 'checking', reason: 'start', since: 0 };
const listeners = new Set<() => void>();
let pending: Promise<void> | null = null;

function set(next: WakeState) {
  state = next;
  listeners.forEach((fn) => fn());
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Один вопрос серверу «ты тут?». Любой ответ 2xx — тут; ошибка, 5xx или тишина — спит. */
async function ping(): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ATTEMPT_MS);
  try {
    const res = await fetch(HEALTH_URL, { cache: 'no-store', credentials: 'omit', signal: ctrl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function fallAsleep(reason: WakeReason) {
  if (state.phase !== 'asleep') set({ phase: 'asleep', reason, since: performance.now() });
}

/**
 * Ждёт, пока сервер ответит. Одновременные вызовы делят одно ожидание.
 * Если ответ не пришёл за SHOW_AFTER_MS — показываем мишку.
 */
export function waitForServer(reason: WakeReason): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    // Нет сети вовсе: будить некого. Сайт сам покажет экран «нет сети».
    if (state.phase === 'checking') set({ ...state, phase: 'up' });
    return Promise.resolve();
  }
  pending ??= (async () => {
    const show = setTimeout(() => fallAsleep(reason), SHOW_AFTER_MS);
    let delay = RETRY_MIN_MS;
    while (!(await ping())) {
      fallAsleep(reason);
      await sleep(delay);
      delay = Math.min(delay * 1.6, RETRY_MAX_MS);
    }
    clearTimeout(show);
    const slept = state.phase === 'asleep' && performance.now() - state.since >= QUICK_MS;
    set({ ...state, phase: slept ? 'awake' : 'up' });
  })().finally(() => {
    pending = null;
  });
  return pending;
}

export const wakeStore = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },
  /** Мишка встал и помахал: убираем экран. */
  finish() {
    if (state.phase === 'awake') set({ ...state, phase: 'up' });
  },
};

/** Только для тестов: вернуть всё как при загрузке страницы. */
export function resetWakeForTests() {
  state = { phase: 'checking', reason: 'start', since: 0 };
  pending = null;
}
