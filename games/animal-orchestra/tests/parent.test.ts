import { afterAll, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import orchestraServer from '../server';

// Мелодии в кабинете родителя (страница «Творчество»). Сессию и проверку кабинета подменяем заголовками.
const KID = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const notes = [{ a: 'bear', t: 0, m: 'instrument' }];
const as = (childId: string) => ({ 'x-test-child': childId });
const parentOf = (childId: string) => ({ 'x-test-parent-of': childId });

describe('мелодии для родителя', () => {
  const app = Fastify();
  app.decorateRequest('session', null);
  app.decorateRequest('canParentView', null);
  app.addHook('onRequest', async (req) => {
    const child = req.headers['x-test-child'];
    const parentOfChild = req.headers['x-test-parent-of'];
    const r = req as unknown as { session: unknown; canParentView: unknown };
    r.session = typeof child === 'string' ? { activeChildId: child } : null;
    r.canParentView = async (id: string) => id === parentOfChild;
  });
  app.register(orchestraServer);
  afterAll(() => app.close());

  it('родитель видит и удаляет мелодии своего ребёнка', async () => {
    const { id } = (await app.inject({ method: 'POST', url: '/melodies', headers: as(KID), payload: { notes } })).json();
    const list = await app.inject({ url: `/parent/${KID}`, headers: parentOf(KID) });
    expect(list.statusCode).toBe(200);
    expect(list.json()).toEqual([expect.objectContaining({ id, notes })]);

    expect((await app.inject({ method: 'DELETE', url: `/parent/${KID}/${id}`, headers: parentOf(KID) })).statusCode).toBe(204);
    expect((await app.inject({ url: `/parent/${KID}`, headers: parentOf(KID) })).json()).toEqual([]);
  });

  it('чужой ребёнок или закрытый кабинет — 403', async () => {
    expect((await app.inject({ url: `/parent/${KID}`, headers: parentOf(OTHER) })).statusCode).toBe(403);
    expect((await app.inject({ url: `/parent/${KID}` })).statusCode).toBe(403);
    expect((await app.inject({ method: 'DELETE', url: `/parent/${KID}/x`, headers: parentOf(OTHER) })).statusCode).toBe(403);
  });
});
