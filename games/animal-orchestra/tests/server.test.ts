import { afterAll, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import orchestraServer from '../server';
import { MAX_MELODIES_PER_PROFILE } from '../server/repository';

const notes = [
  { a: 'bear', t: 0, m: 'instrument' },
  { a: 'cat', t: 400, m: 'voice' },
];

// Сессию платформа кладёт в req.session; здесь подменяем её заголовком теста.
const as = (childId: string) => ({ 'x-test-child': childId });

describe('API оркестра', () => {
  const app = Fastify();
  app.decorateRequest('session', null);
  app.addHook('onRequest', async (req) => {
    const child = req.headers['x-test-child'];
    (req as unknown as { session: unknown }).session = typeof child === 'string' ? { activeChildId: child } : null;
  });
  app.register(orchestraServer);
  afterAll(() => app.close());

  it('сохраняет, отдаёт и удаляет мелодию ребёнка из сессии', async () => {
    const created = await app.inject({ method: 'POST', url: '/melodies', headers: as('c1'), payload: { notes } });
    expect(created.statusCode).toBe(201);
    const { id, title, profileId } = created.json();
    expect(title).toBe('Моя мелодия');
    expect(profileId).toBe('c1');

    expect((await app.inject({ url: '/melodies', headers: as('c1') })).json()).toEqual([expect.objectContaining({ id, notes })]);
    expect((await app.inject({ url: '/melodies', headers: as('c2') })).json()).toEqual([]);

    expect((await app.inject({ method: 'DELETE', url: `/melodies/${id}`, headers: as('c1') })).statusCode).toBe(204);
    expect((await app.inject({ url: '/melodies', headers: as('c1') })).json()).toEqual([]);
  });

  it('без сессии — 401', async () => {
    expect((await app.inject({ url: '/melodies' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/melodies', payload: { notes } })).statusCode).toBe(401);
    expect((await app.inject({ method: 'DELETE', url: '/melodies/x' })).statusCode).toBe(401);
  });

  it('чужой ребёнок не может удалить мелодию', async () => {
    const { id } = (await app.inject({ method: 'POST', url: '/melodies', headers: as('owner'), payload: { notes } })).json();
    expect((await app.inject({ method: 'DELETE', url: `/melodies/${id}`, headers: as('stranger') })).statusCode).toBe(404);
    expect((await app.inject({ url: '/melodies', headers: as('owner') })).json()).toHaveLength(1);
  });

  it('profileId от клиента игнорируется', async () => {
    const res = await app.inject({ method: 'POST', url: '/melodies', headers: as('real'), payload: { profileId: 'victim', notes } });
    expect(res.statusCode).toBe(201);
    expect(res.json().profileId).toBe('real');
    expect((await app.inject({ url: '/melodies', headers: as('victim') })).json()).toEqual([]);
  });

  it.each([
    ['пустая мелодия', { notes: [] }],
    ['неизвестный зверь', { notes: [{ a: 'dragon', t: 0, m: 'voice' }] }],
    ['слишком длинная', { notes: [{ a: 'bear', t: 999_999, m: 'voice' }] }],
  ])('отклоняет: %s', async (_name, payload) => {
    expect((await app.inject({ method: 'POST', url: '/melodies', headers: as('c1'), payload })).statusCode).toBe(400);
  });

  it(`хранит не больше ${MAX_MELODIES_PER_PROFILE} мелодий на ребёнка`, async () => {
    for (let i = 0; i < MAX_MELODIES_PER_PROFILE + 3; i++) {
      await app.inject({ method: 'POST', url: '/melodies', headers: as('busy'), payload: { notes } });
    }
    expect((await app.inject({ url: '/melodies', headers: as('busy') })).json()).toHaveLength(MAX_MELODIES_PER_PROFILE);
  });
});
