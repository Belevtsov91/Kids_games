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

/** Для входа с несуществующей почтой: тратим то же время, чтобы по задержке нельзя было угадать почту. */
export const DUMMY_HASH = await hashPassword(randomBytes(16).toString('hex'));
