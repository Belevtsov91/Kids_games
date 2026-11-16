import { afterAll, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import studioServer from '../server';
import { MAX_BEATS_PER_PROFILE } from '../server/repository';

const pattern = [1, 0, 4369, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const beat = { bpm: 100, pattern };

// Сессию платформа кладёт в req.session, проверку кабинета — в req.canParentView.
// Здесь подменяем их заголовками теста.
const as = (childId: string) => ({ 'x-test-child': childId });
const parentOf = (childId: string) => ({ 'x-test-parent-of': childId });

describe('API Бит-студии', () => {
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
  app.register(studioServer);
  afterAll(() => app.close());

  const save = (child: string, payload: object = beat) => app.inject({ method: 'POST', url: '/beats', headers: as(child), payload });

  it('сохраняет, отдаёт и удаляет бит ребёнка из сессии', async () => {
    const created = await save('c1');
    expect(created.statusCode).toBe(201);
    const { id, title, profileId, shared, swing } = created.json();
    expect({ title, profileId, shared, swing }).toEqual({ title: 'Мой бит', profileId: 'c1', shared: false, swing: 0 });

    expect((await app.inject({ url: '/beats', headers: as('c1') })).json()).toEqual([expect.objectContaining({ id, pattern })]);
    expect((await app.inject({ url: '/beats', headers: as('c2') })).json()).toEqual([]);

    expect((await app.inject({ method: 'DELETE', url: `/beats/${id}`, headers: as('c1') })).statusCode).toBe(204);
    expect((await app.inject({ url: '/beats', headers: as('c1') })).json()).toEqual([]);
  });

  it('без сессии — 401', async () => {
    expect((await app.inject({ url: '/beats' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/beats', payload: beat })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/beats/x/share', payload: { shared: true } })).statusCode).toBe(401);
  });

  it('родитель видит только биты, которые ребёнок ему показал', async () => {
    const shown = (await save('kid', { ...beat, title: 'Для мамы' })).json();
    await save('kid', { ...beat, title: 'Секрет' });
    const res = await app.inject({ method: 'POST', url: `/beats/${shown.id}/share`, headers: as('kid'), payload: { shared: true } });
    expect(res.json().shared).toBe(true);

    const list = await app.inject({ url: '/parent/kid', headers: parentOf('kid') });
    expect(list.statusCode).toBe(200);
    expect(list.json().map((b: { title: string }) => b.title)).toEqual(['Для мамы']);
    expect((await app.inject({ url: '/parent/kid', headers: parentOf('other') })).statusCode).toBe(403);
    expect((await app.inject({ url: '/parent/kid' })).statusCode).toBe(403);
  });

  it('чужой ребёнок не может поделиться или удалить бит', async () => {
    const { id } = (await save('owner')).json();
    expect((await app.inject({ method: 'POST', url: `/beats/${id}/share`, headers: as('stranger'), payload: { shared: true } })).statusCode).toBe(404);
    expect((await app.inject({ method: 'DELETE', url: `/beats/${id}`, headers: as('stranger') })).statusCode).toBe(404);
    expect((await app.inject({ url: '/beats', headers: as('owner') })).json()).toHaveLength(1);
  });

  it('profileId и shared от клиента игнорируются', async () => {
    const res = await save('real', { ...beat, profileId: 'victim', shared: true });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ profileId: 'real', shared: false });
    expect((await app.inject({ url: '/beats', headers: as('victim') })).json()).toEqual([]);
  });

  it.each([
    ['без ритма', { bpm: 100 }],
    ['короткий ритм', { bpm: 100, pattern: [1, 2, 3] }],
    ['маска больше 16 бит', { bpm: 100, pattern: Array(16).fill(70000) }],
    ['слишком быстрый темп', { bpm: 400, pattern }],
    ['слишком сильный свинг', { bpm: 100, swing: 2, pattern }],
  ])('отклоняет: %s', async (_name, payload) => {
    expect((await save('c1', payload)).statusCode).toBe(400);
  });

  it(`хранит не больше ${MAX_BEATS_PER_PROFILE} битов на ребёнка`, async () => {
    for (let i = 0; i < MAX_BEATS_PER_PROFILE + 3; i++) await save('busy');
    expect((await app.inject({ url: '/beats', headers: as('busy') })).json()).toHaveLength(MAX_BEATS_PER_PROFILE);
  });
});
