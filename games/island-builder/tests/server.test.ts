import { afterAll, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import islandServer from '../server';
import { emptyStats, generateIsland, serialize } from '../src/game/world';

// Сессию в проде вешает платформа; здесь — тестовый хук по заголовку.
const app = Fastify();
app.decorateRequest('session', null);
app.addHook('onRequest', async (req) => {
  const child = req.headers['x-test-child'];
  (req as unknown as { session: unknown }).session = typeof child === 'string' ? { parentId: 'p1', activeChildId: child } : null;
});
await app.register(islandServer);
afterAll(() => app.close());

const as = (child: string) => ({ 'x-test-child': child });
const save = serialize({ world: generateIsland(3), stats: { ...emptyStats(), placed: 7 }, night: false, achieved: ['builder'] });

describe('сервер острова', () => {
  it('без сессии — 401 на чтение, запись и удаление', async () => {
    expect((await app.inject('/island')).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/island', payload: save })).statusCode).toBe(401);
    expect((await app.inject({ method: 'DELETE', url: '/island' })).statusCode).toBe(401);
  });

  it('у нового ребёнка острова нет', async () => {
    const res = await app.inject({ url: '/island', headers: as('new-kid') });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ island: null, updatedAt: null });
  });

  it('сохраняет и отдаёт остров только своему ребёнку', async () => {
    const post = await app.inject({ method: 'POST', url: '/island', headers: as('kid-1'), payload: save });
    expect(post.statusCode).toBe(200);
    expect((await app.inject({ url: '/island', headers: as('kid-1') })).json().island).toEqual(save);
    expect((await app.inject({ url: '/island', headers: as('kid-2') })).json().island).toBeNull();
  });

  it('отклоняет кривые данные', async () => {
    const bad = [
      { ...save, v: 2 },
      { ...save, blocks: [[0, 0, 0, 99]] },
      { ...save, blocks: [[0, 50, 0, 0]] },
      { ...save, trees: Array.from({ length: 500 }, () => [0, 1, 0, 0]) },
      { ...save, achieved: ['<script>'] },
      { blocks: [] },
    ];
    for (const payload of bad) {
      const res = await app.inject({ method: 'POST', url: '/island', headers: as('kid-1'), payload });
      expect(res.statusCode, JSON.stringify(payload).slice(0, 80)).toBe(400);
    }
  });

  it('удаляет остров', async () => {
    await app.inject({ method: 'POST', url: '/island', headers: as('kid-3'), payload: save });
    expect((await app.inject({ method: 'DELETE', url: '/island', headers: as('kid-3') })).statusCode).toBe(204);
    expect((await app.inject({ url: '/island', headers: as('kid-3') })).json().island).toBeNull();
  });
});
