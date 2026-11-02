import type { FastifyPluginAsync } from 'fastify';

// Серверная часть игры: платформа подключит её под /api/games/__GAME_ID__.
// Не нужна — удалите папку server/.
const server: FastifyPluginAsync = async (app) => {
  app.get('/hello', async () => ({ game: '__GAME_ID__' }));
};

export default server;
