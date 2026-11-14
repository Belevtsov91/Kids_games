import type { FastifyPluginAsync } from 'fastify';
import type { GameManifest } from '@ig/sdk/manifest';
import { siteFlags } from '../modules/admin/flags.js';

// Каталог игр — те же манифесты, что видит меню. Позже здесь же доступность и возрастные ограничения.
export const catalogRoutes: FastifyPluginAsync<{ catalog: GameManifest[] }> = async (app, { catalog }) => {
  // Игры, которые владелец выключил для всех в админке, из каталога пропадают.
  app.get('/', async () => {
    const off = (await siteFlags()).disabled_games;
    return off.length ? catalog.filter((g) => !off.includes(g.id)) : catalog;
  });

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const game = catalog.find((g) => g.id === req.params.id);
    if (!game) return reply.code(404).send({ error: 'Game not found' });
    return game;
  });
};
