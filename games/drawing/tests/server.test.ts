import { afterAll, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import drawingServer from '../server';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

describe('API рисовалки', () => {
  const app = Fastify();
  app.register(drawingServer);
  afterAll(() => app.close());

  it('сохраняет, отдаёт и удаляет рисунок', async () => {
    const created = await app.inject({ method: 'POST', url: '/drawings', payload: { profileId: 'p1', image: PNG } });
    expect(created.statusCode).toBe(201);
    const { id } = created.json();

    const list = await app.inject({ url: '/drawings?profileId=p1' });
    expect(list.json()).toEqual([expect.objectContaining({ id, title: 'Без названия' })]);
    expect(list.json()[0]).not.toHaveProperty('image');

    expect((await app.inject({ url: `/drawings/${id}` })).json().image).toBe(PNG);
    expect((await app.inject({ method: 'DELETE', url: `/drawings/${id}` })).statusCode).toBe(204);
    expect((await app.inject({ url: `/drawings/${id}` })).statusCode).toBe(404);
  });

  it('отклоняет не-PNG', async () => {
    const res = await app.inject({ method: 'POST', url: '/drawings', payload: { profileId: 'p1', image: 'hello' } });
    expect(res.statusCode).toBe(400);
  });
});
