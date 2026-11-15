import { describe, expect, it } from 'vitest';
import { keyBytes, needsInstall } from './push';

describe('push на устройстве', () => {
  it('ключ VAPID из base64url в байты', () => {
    expect(Array.from(keyBytes('AQID_-8'))).toEqual([1, 2, 3, 255, 239]);
  });

  it('iPhone без экрана «Домой» просит установить сайт', () => {
    const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)';
    expect(needsInstall(iphone, false)).toBe(true);
    expect(needsInstall(iphone, true)).toBe(false);
    expect(needsInstall('Mozilla/5.0 (Linux; Android 15)', false)).toBe(false);
  });
});
