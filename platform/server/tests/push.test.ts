import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { pushEnabled, pushToParent } from '../src/modules/notify/push';

const log = { error: () => undefined } as never;

describe('push-уведомления', () => {
  it('без ключей VAPID push выключен и ничего не отправляет', async () => {
    expect(pushEnabled).toBe(false);
    expect(await pushToParent('00000000-0000-0000-0000-000000000000', { title: 't', body: 'b', tag: 'x', url: '/' }, log)).toBe(0);
  });
});

describe('подписка на push закрыта без кабинета', async () => {
  const app = await buildApp({ logger: false });
  afterAll(() => app.close());

  it('без БД и входа — 503, с чужого сайта — 403', async () => {
    expect((await app.inject('/api/parent/push')).statusCode).toBe(503);
    const res = await app.inject({
      method: 'POST',
      url: '/api/parent/push',
      headers: { origin: 'https://evil.example' },
      payload: { endpoint: 'https://push.example/abc', keys: { p256dh: 'a'.repeat(40), auth: 'b'.repeat(16) } },
    });
    expect(res.statusCode).toBe(403);
  });
});
