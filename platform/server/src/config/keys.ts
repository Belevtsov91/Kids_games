import { hkdfSync } from 'node:crypto';
import { env } from './env.js';

// Из одного SESSION_ENCRYPTION_KEY выводим отдельные ключи под каждую задачу (HKDF-SHA256):
// утечка подписи одного вида токенов не помогает подделать другой.
// Без ключа — пустая строка: вызывающий код считает такую подпись выключенной.

const cache = new Map<string, string>();

export function derivedSecret(purpose: 'gate' | 'answer'): string {
  const master = env.sessionEncryptionKey;
  if (!master) return '';
  let key = cache.get(purpose);
  if (!key) {
    key = Buffer.from(hkdfSync('sha256', Buffer.from(master, 'utf8'), 'interact-games', `ig:${purpose}`, 32)).toString('hex');
    cache.set(purpose, key);
  }
  return key;
}
