import type { FastifyPluginAsync } from 'fastify';

interface Game {
  id: string;
  title: string;
  kind: '2d' | '3d';
}

// Заглушка: каталог игр. Позже — из БД.
const games: Game[] = [
  { id: 'drawing', title: 'Рисовалка', kind: '2d' },
  { id: 'playground3d', title: '3D песочница', kind: '3d' },
];

export const gamesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => games);

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const game = games.find((g) => g.id === req.params.id);
    if (!game) return reply.code(404).send({ error: 'Game not found' });
    return game;
  });
};
