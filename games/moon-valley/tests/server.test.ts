import { afterAll, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import moonValleyServer from '../server';
import { initialState } from '../src/game/valley';

// Сессию в проде вешает платформа; здесь — тестовый хук по заголовку.
const app = Fastify();
app.decorateRequest('session', null);
app.addHook('onRequest', async (req) => {
  const child = req.headers['x-test-child'];
  (req as unknown as { session: unknown }).session = typeof child === 'string' ? { parentId: 'p1', activeChildId: child } : null;
});
await app.register(moonValleyServer);
afterAll(() => app.close());

const as = (child: string) => ({ 'x-test-child': child });
const save = { ...initialState(), level: 2, savedAt: 123 };

describe('сервер Лунной Долины', () => {
  it('без ребёнка в сессии — 401', async () => {
    expect((await app.inject('/save')).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/save', payload: save })).statusCode).toBe(401);
  });

  it('у нового ребёнка сохранения нет', async () => {
    expect((await app.inject({ url: '/save', headers: as('new-kid') })).json()).toEqual({ save: null, updatedAt: null });
  });

  it('сохраняет и отдаёт прогресс только своему ребёнку', async () => {
    expect((await app.inject({ method: 'POST', url: '/save', headers: as('kid-1'), payload: save })).statusCode).toBe(200);
    expect((await app.inject({ url: '/save', headers: as('kid-1') })).json().save).toEqual(save);
    expect((await app.inject({ url: '/save', headers: as('kid-2') })).json().save).toBeNull();
  });

  it('отклоняет кривые данные', async () => {
    const bad = [{ ...save, level: 99 }, { ...save, starlight: -1 }, { ...save, plots: [{ id: 9, stage: 1 }] }, { ...save, opened: ['<b>'] }, { level: 1 }];
    for (const payload of bad) {
      const res = await app.inject({ method: 'POST', url: '/save', headers: as('kid-1'), payload });
      expect(res.statusCode, JSON.stringify(payload).slice(0, 60)).toBe(400);
    }
  });

  it('удаляет сохранение', async () => {
    expect((await app.inject({ method: 'DELETE', url: '/save', headers: as('kid-1') })).statusCode).toBe(204);
    expect((await app.inject({ url: '/save', headers: as('kid-1') })).json().save).toBeNull();
  });
});
