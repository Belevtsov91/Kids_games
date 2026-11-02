import { afterAll, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from '../src/app';

describe('сервер с настоящей папкой games/', async () => {
  const app = await buildApp({ logger: false });
  afterAll(() => app.close());

  it('отвечает на health', async () => {
    expect((await app.inject('/api/health')).json().status).toBe('ok');
  });

  it('каталог собран из манифестов', async () => {
    const ids = (await app.inject('/api/games')).json().map((g: { id: string }) => g.id);
    expect(ids).toEqual(expect.arrayContaining(['drawing', 'playground3d']));
    expect((await app.inject('/api/games/drawing')).json().title).toBe('Рисовалка');
    expect((await app.inject('/api/games/nope')).statusCode).toBe(404);
  });

  it('API игры подключено под /api/games/<id>', async () => {
    // Маршрут игры существует (не 404) и закрыт без выбранного ребёнка.
    const res = await app.inject('/api/games/drawing/drawings');
    expect(res.statusCode).toBe(401);
  });
});

describe('изоляция игр', async () => {
  // Временная папка: игра с сервером, игра без сервера и игра с битым манифестом.
  const dir = mkdtempSync(join(tmpdir(), 'ig-games-'));
  const game = (id: string, manifest: string, server?: string) => {
    mkdirSync(join(dir, id, 'server'), { recursive: true });
    writeFileSync(join(dir, id, 'manifest.ts'), `export default ${manifest};`);
    if (server) writeFileSync(join(dir, id, 'server', 'index.ts'), server);
  };
  const manifest = (id: string) => JSON.stringify({ id, title: id, emoji: '🎲', kind: '2d', ages: { min: 3, max: 15 } });
  game('alpha', manifest('alpha'), `export default async (app) => { app.get('/ping', async () => 'alpha'); };`);
  game('beta', manifest('beta'));
  game('broken', JSON.stringify({ id: 'other' }), `export default async (app) => { app.get('/ping', async () => 'x'); };`);

  const app = await buildApp({ gamesDir: dir, logger: false });
  afterAll(async () => {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('битая игра не попадает в каталог и не роняет остальные', async () => {
    const ids = (await app.inject('/api/games')).json().map((g: { id: string }) => g.id);
    expect(ids).toEqual(['alpha', 'beta']);
    expect((await app.inject('/api/games/broken/ping')).statusCode).toBe(404);
  });

  it('маршруты игры живут только под её префиксом', async () => {
    expect((await app.inject('/api/games/alpha/ping')).body).toBe('alpha');
    expect((await app.inject('/api/games/beta/ping')).statusCode).toBe(404);
  });
});
