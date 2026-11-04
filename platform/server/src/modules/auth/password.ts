import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

// Хеш пароля: scrypt из node:crypto (без нативных зависимостей). Формат: scrypt$N$r$p$соль$хеш.

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LEN = 64;

const derive = (password: string, salt: Buffer, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize('NFKC'), salt, KEY_LEN, { ...options, maxmem: 128 * options.N! * options.r! * 2 }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, n, r, p, salt, hash] = stored.split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const key = await derive(password, Buffer.from(salt, 'base64url'), { N: Number(n), r: Number(r), p: Number(p) });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/**
 * Слишком простой новый пароль. Те же правила, что подсказывает форма (shell/src/auth/validation.ts):
 * кроме длины (её проверяет схема) — хотя бы два из трёх: строчные и заглавные, цифра, символ; и не повторять почту.
 */
export function isWeakPassword(password: string, email = '') {
  const kinds = [/\p{Ll}/u.test(password) && /\p{Lu}/u.test(password), /\d/.test(password), /[^\p{L}\d\s]/u.test(password)];
  const local = email.split('@')[0].toLowerCase();
  return kinds.filter(Boolean).length < 2 || (local.length >= 4 && password.toLowerCase().includes(local));
}

export const WEAK_PASSWORD = { error: 'Пароль слишком простой', code: 'weakPassword' } as const;

/** Для входа с несуществующей почтой: тратим то же время, чтобы по задержке нельзя было угадать почту. */
export const DUMMY_HASH = await hashPassword(randomBytes(16).toString('hex'));
