import { expect, it } from 'vitest';
import Fastify from 'fastify';
import { validateManifest } from '@ig/sdk';
import manifest from '../manifest';
import server from '../server';

it('манифест корректен', () => {
  expect(validateManifest(manifest, '__GAME_ID__')).toEqual([]);
});

it('сервер игры отвечает', async () => {
  const app = Fastify();
  await app.register(server);
  expect((await app.inject('/hello')).json()).toEqual({ game: '__GAME_ID__' });
  await app.close();
});
