import { afterAll, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import server from '../server';

// Сессию в проде кладёт платформа; здесь подставляем её из заголовка теста.
function buildApp() {
  const app = Fastify();
  app.decorateRequest('session', null);
  app.addHook('onRequest', async (req) => {
    const child = req.headers['x-test-child'];
    (req as unknown as { session: unknown }).session = child ? { parentId: 'p1', activeChildId: String(child) } : null;
  });
  app.register(server);
  return app;
}

describe('API Буквоеда', () => {
  const app = buildApp();
  afterAll(() => app.close());

  it('без входа прогресс не отдаётся и не пишется', async () => {
    expect((await app.inject('/progress')).statusCode).toBe(401);
    const res = await app.inject({ method: 'POST', url: '/progress', payload: { level: 0, stars: 3 } });
    expect(res.statusCode).toBe(401);
  });

  it('хранит лучший результат по уровню для каждого ребёнка отдельно', async () => {
    const save = (child: string, level: number, stars: number) =>
      app.inject({ method: 'POST', url: '/progress', headers: { 'x-test-child': child }, payload: { level, stars } });

    expect((await app.inject({ url: '/progress', headers: { 'x-test-child': 'c1' } })).json()).toEqual({ stars: [0, 0, 0, 0, 0] });
    expect((await save('c1', 0, 2)).json()).toEqual({ stars: [2, 0, 0, 0, 0] });
    expect((await save('c1', 0, 1)).json()).toEqual({ stars: [2, 0, 0, 0, 0] });
    expect((await save('c1', 1, 3)).json()).toEqual({ stars: [2, 3, 0, 0, 0] });
    expect((await app.inject({ url: '/progress', headers: { 'x-test-child': 'c2' } })).json()).toEqual({ stars: [0, 0, 0, 0, 0] });
  });

  it('отклоняет неверные данные', async () => {
    const bad = [{ level: 9, stars: 1 }, { level: 0, stars: 4 }, { level: 0, stars: 0 }];
    for (const payload of bad) {
      const res = await app.inject({ method: 'POST', url: '/progress', headers: { 'x-test-child': 'c1' }, payload });
      expect(res.statusCode).toBe(400);
    }
  });
});
