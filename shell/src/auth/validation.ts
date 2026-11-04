// Проверки полей входа и регистрации на стороне браузера. Сервер всё равно проверяет сам;
// здесь — быстрые подсказки, чтобы взрослый видел ошибку сразу, а не после отправки.

export type EmailError = 'empty' | 'noAt' | 'format';
export type NameError = 'short' | 'chars';
export type NewPassError = 'empty' | 'short' | 'weak' | 'long' | 'likeEmail';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DOMAINS = ['gmail.com', 'mail.ru', 'yandex.ru', 'ya.ru', 'outlook.com', 'hotmail.com', 'icloud.com', 'yahoo.com', 'ukr.net', 'bk.ru', 'list.ru', 'inbox.ru', 'rambler.ru'];
/** Совпадает с ограничениями сервера. */
export const LIMITS = { email: 254, name: 40, passMin: 8, passMax: 72 };

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Похоже на опечатку в популярном домене (gmial.com) — вернёт исправленный адрес. */
export function domainHint(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 0) return null;
  const domain = email.slice(at + 1).toLowerCase();
  if (!domain || DOMAINS.includes(domain)) return null;
  let best: string | null = null, bestD = 3;
  for (const d of DOMAINS) {
    const k = distance(domain, d);
    if (k < bestD) [best, bestD] = [d, k];
  }
  return best ? email.slice(0, at + 1) + best : null;
}

export function checkEmail(raw: string): { error: EmailError | null; hint: string | null } {
  const v = raw.trim();
  if (!v) return { error: 'empty', hint: null };
  if (!v.includes('@')) return { error: 'noAt', hint: null };
  if (!EMAIL_RE.test(v) || v.length > LIMITS.email) return { error: 'format', hint: null };
  return { error: null, hint: domainHint(v) };
}

export function checkName(raw: string): NameError | null {
  const v = raw.trim();
  if (v.length < 2) return 'short';
  if (!/^[\p{L}' -]+$/u.test(v)) return 'chars';
  return null;
}

export interface PassRules {
  len: boolean;
  case: boolean;
  digit: boolean;
  sym: boolean;
}

export function passRules(v: string): PassRules {
  return {
    len: v.length >= LIMITS.passMin,
    case: /\p{Ll}/u.test(v) && /\p{Lu}/u.test(v),
    digit: /\d/.test(v),
    sym: /[^\p{L}\d\s]/u.test(v),
  };
}

/** Надёжность 0–4: сколько правил выполнено; короткий пароль — не выше 1. */
export function passScore(v: string): number {
  if (!v) return 0;
  const r = passRules(v);
  const n = Object.values(r).filter(Boolean).length;
  return r.len ? n : Math.min(n, 1);
}

export function checkNewPassword(v: string, email: string): NewPassError | null {
  if (!v) return 'empty';
  if (v.length < LIMITS.passMin) return 'short';
  if (v.length > LIMITS.passMax) return 'long';
  if (passScore(v) < 3) return 'weak';
  const local = email.split('@')[0].toLowerCase();
  if (local.length >= 4 && v.toLowerCase().includes(local)) return 'likeEmail';
  return null;
}
