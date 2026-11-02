import type { FastifyPluginAsync } from 'fastify';
import { childIdOf, requireChild } from '@ig/sdk/server';

// Серверная часть игры: платформа подключит её под /api/games/__GAME_ID__.
// Не нужна — удалите папку server/.
const server: FastifyPluginAsync = async (app) => {
  app.get('/hello', async () => ({ game: '__GAME_ID__' }));

  // Данные ребёнка: кто он, берём только из сессии, а не из запроса.
  app.get('/me', { preHandler: requireChild }, async (req) => ({ childId: childIdOf(req) }));
};

export default server;
