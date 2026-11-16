import type { FastifyPluginAsync } from 'fastify';
import type { GameServerOptions } from '@ig/sdk/server';
import { parentMelodiesRoutes } from './parentRoutes.js';
import { createMelodiesRepository } from './repository.js';
import { melodiesRoutes } from './routes.js';

// Серверная часть оркестра. Платформа подключает её под /api/games/animal-orchestra.
// Одно хранилище на оба набора маршрутов: без БД ребёнок и родитель видят одни и те же мелодии.
const orchestraServer: FastifyPluginAsync<GameServerOptions> = async (app, opts) => {
  const repo = createMelodiesRepository(opts.db);
  await app.register(melodiesRoutes, { prefix: '/melodies', repo });
  await app.register(parentMelodiesRoutes, { prefix: '/parent', repo });
};

export default orchestraServer;
