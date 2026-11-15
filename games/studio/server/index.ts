import type { FastifyPluginAsync } from 'fastify';
import type { GameServerOptions } from '@ig/sdk/server';
import { parentBeatsRoutes } from './parentRoutes.js';
import { createBeatsRepository } from './repository.js';
import { beatsRoutes } from './routes.js';

// Серверная часть Бит-студии. Платформа подключает её под /api/games/studio.
const studioServer: FastifyPluginAsync<GameServerOptions> = async (app, opts) => {
  const repo = createBeatsRepository(opts.db);
  await app.register(beatsRoutes, { prefix: '/beats', repo });
  await app.register(parentBeatsRoutes, { prefix: '/parent', repo });
};

export default studioServer;
