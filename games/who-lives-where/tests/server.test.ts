import { afterAll, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import server from '../server';

// Сессию платформы подменяем: ребёнок берётся из заголовка теста.
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

describe('API «Кто где живёт»', () => {
  const app = buildApp();
  afterAll(() => app.close());
  const as = (child: string) => ({ 'x-test-child': child });

  it('без выбранного ребёнка — 401', async () => {
    expect((await app.inject('/progress')).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/progress', payload: { level: 2 } })).statusCode).toBe(401);
  });

  it('новый ребёнок начинает с первого уровня', async () => {
    expect((await app.inject({ url: '/progress', headers: as('new') })).json()).toEqual({ level: 1, found: [] });
  });

  it('сохраняет прогресс отдельно для каждого ребёнка и не откатывает уровень', async () => {
    await app.inject({ method: 'POST', url: '/progress', headers: as('c1'), payload: { level: 3, found: ['cow', 'fox'] } });
    const res = await app.inject({ method: 'POST', url: '/progress', headers: as('c1'), payload: { level: 2, found: ['whale'] } });
    expect(res.json()).toEqual({ level: 3, found: ['cow', 'fox', 'whale'] });
    expect((await app.inject({ url: '/progress', headers: as('c2') })).json()).toEqual({ level: 1, found: [] });
  });

  it('отклоняет неверное тело и не сохраняет лишнее', async () => {
    const bad = await app.inject({ method: 'POST', url: '/progress', headers: as('c1'), payload: { level: 'max' } });
    expect(bad.statusCode).toBe(400);
    const extra = await app.inject({ method: 'POST', url: '/progress', headers: as('c1'), payload: { level: 2, admin: true } });
    // Лишние поля Fastify молча отбрасывает: в прогресс они не попадают.
    expect(extra.json()).not.toHaveProperty('admin');
  });
});
