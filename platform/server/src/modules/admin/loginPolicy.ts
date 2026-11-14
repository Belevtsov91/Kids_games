// Правила входа владельца, без БД — их проверяют тесты.

export const MAX_FAILED = 5;
export const LOCK_MS = 15 * 60 * 1000;

/** Заблокирован ли вход сейчас. */
export const isLocked = (lockedUntil: string | null | undefined, now = new Date()) =>
  Boolean(lockedUntil && new Date(lockedUntil).getTime() > now.getTime());

/** Что записать после неудачной попытки: новый счётчик и, на пятой, срок блокировки. */
export function afterFailure(failed: number, now = new Date()) {
  const next = failed + 1;
  if (next < MAX_FAILED) return { failed: next, lockedUntil: null as string | null, justLocked: false };
  return { failed: 0, lockedUntil: new Date(now.getTime() + LOCK_MS).toISOString(), justLocked: true };
}

/** Коротко об устройстве для письма: «Chrome, Windows». */
export function deviceLabel(userAgent: string | undefined) {
  const ua = userAgent ?? '';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'браузер';
  const system = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'неизвестная система';
  return `${browser}, ${system}`;
}

/** Вид устройства для статистики: телефон, планшет или компьютер. */
export function deviceKind(userAgent: string | undefined): 'phone' | 'tablet' | 'desktop' {
  const ua = userAgent ?? '';
  if (/iPad|Tablet|Android(?!.*Mobile)/.test(ua)) return 'tablet';
  if (/Mobi|iPhone|Android/.test(ua)) return 'phone';
  return 'desktop';
}
