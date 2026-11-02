import { afterAll, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import drawingServer from '../server';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

// Сессию в проде кладёт платформа; здесь — тестовый хук по заголовку.
const as = (childId: string) => ({ 'x-test-child': childId });

describe('API рисовалки', () => {
  const app = Fastify();
  app.decorateRequest('session', null);
  app.addHook('onRequest', async (req) => {
    const child = req.headers['x-test-child'];
    (req as unknown as { session: unknown }).session = typeof child === 'string' ? { parentId: 'p1', activeChildId: child } : null;
  });
  app.register(drawingServer);
  afterAll(() => app.close());

  it('сохраняет, отдаёт и удаляет рисунок ребёнка из сессии', async () => {
    const created = await app.inject({ method: 'POST', url: '/drawings', headers: as('c1'), payload: { image: PNG } });
    expect(created.statusCode).toBe(201);
    const { id } = created.json();

    const list = await app.inject({ url: '/drawings', headers: as('c1') });
    expect(list.json()).toEqual([expect.objectContaining({ id, title: 'Без названия', profileId: 'c1' })]);
    expect(list.json()[0]).not.toHaveProperty('image');

    expect((await app.inject({ url: `/drawings/${id}`, headers: as('c1') })).json().image).toBe(PNG);
    expect((await app.inject({ method: 'DELETE', url: `/drawings/${id}`, headers: as('c1') })).statusCode).toBe(204);
    expect((await app.inject({ url: `/drawings/${id}`, headers: as('c1') })).statusCode).toBe(404);
  });

  it('чужой рисунок не видно и нельзя удалить', async () => {
    const { id } = (await app.inject({ method: 'POST', url: '/drawings', headers: as('owner'), payload: { image: PNG } })).json();
    expect((await app.inject({ url: '/drawings', headers: as('stranger') })).json()).toEqual([]);
    expect((await app.inject({ url: `/drawings/${id}`, headers: as('stranger') })).statusCode).toBe(404);
    expect((await app.inject({ method: 'DELETE', url: `/drawings/${id}`, headers: as('stranger') })).statusCode).toBe(404);
    expect((await app.inject({ url: `/drawings/${id}`, headers: as('owner') })).statusCode).toBe(200);
  });

  it('profileId от клиента игнорируется', async () => {
    const res = await app.inject({ method: 'POST', url: '/drawings', headers: as('real'), payload: { profileId: 'victim', image: PNG } });
    expect(res.statusCode).toBe(201);
    expect((await app.inject({ url: '/drawings', headers: as('victim') })).json()).toEqual([]);
    expect((await app.inject({ url: '/drawings', headers: as('real') })).json()).toHaveLength(1);
  });

  it('без выбранного ребёнка — 401', async () => {
    expect((await app.inject({ url: '/drawings' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/drawings', payload: { image: PNG } })).statusCode).toBe(401);
  });

  it('отклоняет не-PNG', async () => {
    const res = await app.inject({ method: 'POST', url: '/drawings', headers: as('c1'), payload: { image: 'hello' } });
    expect(res.statusCode).toBe(400);
  });
});
