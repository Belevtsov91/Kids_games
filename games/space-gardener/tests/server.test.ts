import { afterAll, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import server from '../server';

// Сессию в проде кладёт платформа; здесь — тестовый хук по заголовку.
const as = (childId: string) => ({ 'x-test-child': childId });

describe('API прогресса садовника', () => {
  const app = Fastify();
  app.decorateRequest('session', null);
  app.addHook('onRequest', async (req) => {
    const child = req.headers['x-test-child'];
    (req as unknown as { session: unknown }).session = typeof child === 'string' ? { parentId: 'p1', activeChildId: child } : null;
  });
  app.register(server);
  afterAll(() => app.close());

  const record = (child: string, payload: object) => app.inject({ method: 'POST', url: '/progress', headers: as(child), payload });

  it('у нового профиля прогресса нет', async () => {
    const res = await app.inject({ url: '/progress', headers: as('new-kid') });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ profileId: 'new-kid', levels: {} });
  });

  it('хранит лучший результат и не путает профили', async () => {
    await record('kid-1', { levelId: 'sprout', stars: 2 });
    await record('kid-1', { levelId: 'sprout', stars: 1 });
    const best = await record('kid-1', { levelId: 'rock', stars: 3 });
    expect(best.json()).toEqual({ profileId: 'kid-1', levels: { sprout: 2, rock: 3 } });

    await record('kid-1', { levelId: 'sprout', stars: 3 });
    expect((await app.inject({ url: '/progress', headers: as('kid-1') })).json().levels.sprout).toBe(3);
    expect((await app.inject({ url: '/progress', headers: as('kid-2') })).json().levels).toEqual({});
  });

  it('profileId от клиента игнорируется', async () => {
    expect((await record('real', { profileId: 'victim', levelId: 'sprout', stars: 1 })).json().profileId).toBe('real');
    expect((await app.inject({ url: '/progress', headers: as('victim') })).json().levels).toEqual({});
  });

  it('отклоняет неверные данные', async () => {
    expect((await record('kid-1', { levelId: 'sprout', stars: 5 })).statusCode).toBe(400);
    expect((await record('kid-1', { levelId: 'Bad Id!', stars: 1 })).statusCode).toBe(400);
  });

  it('без выбранного ребёнка — 401', async () => {
    expect((await app.inject({ url: '/progress' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/progress', payload: { levelId: 'sprout', stars: 1 } })).statusCode).toBe(401);
  });
});
