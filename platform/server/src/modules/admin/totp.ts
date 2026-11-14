import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// Код из приложения-аутентификатора (TOTP, RFC 6238): HMAC-SHA1, 6 цифр, шаг 30 секунд.
// Свой маленький код вместо зависимости: тут два десятка строк и только node:crypto.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const STEP_SECONDS = 30;

export function base32Encode(bytes: Buffer) {
  let bits = 0, value = 0, out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string) {
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const ch of text.toUpperCase().replace(/[\s=-]/g, '')) {
    const index = ALPHABET.indexOf(ch);
    if (index < 0) throw new Error('Неверный секрет');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** Новый секрет: 20 случайных байт в base32, как ждут приложения. */
export const newSecret = () => base32Encode(randomBytes(20));

export const stepAt = (now: Date) => Math.floor(now.getTime() / 1000 / STEP_SECONDS);

export function codeAt(secret: string, step: number) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const mac = createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const offset = mac[mac.length - 1] & 15;
  const num = (mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(num).padStart(6, '0');
}

/**
 * Проверка кода: принимаем текущий шаг и по одному соседнему (часы телефона могут отставать).
 * Возвращает шаг, на котором код подошёл, или null. Шаг не новее lastStep не принимаем: код одноразовый.
 */
export function verifyCode(secret: string, code: string, lastStep: number, now = new Date()): number | null {
  const given = Buffer.from(code.replace(/\s/g, ''));
  if (given.length !== 6) return null;
  const current = stepAt(now);
  for (const step of [current, current - 1, current + 1]) {
    if (step <= lastStep) continue;
    if (timingSafeEqual(given, Buffer.from(codeAt(secret, step)))) return step;
  }
  return null;
}

/** Ссылка для QR-кода и для кнопки «добавить в приложение». Название в приложении нейтральное. */
export const otpauthUri = (email: string, secret: string, issuer = 'Console') =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=${STEP_SECONDS}`;
