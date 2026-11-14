import type { FastifyPluginAsync } from 'fastify';
import type { GameManifest } from '@ig/sdk/manifest';
import type { GameTable } from '../parent/index.js';
import { adminAuthRoutes } from './auth.routes.js';
import { adminChildrenRoutes } from './children.routes.js';
import { familiesRoutes } from './families.routes.js';
import { familyActionsRoutes } from './familyActions.routes.js';
import { familyDangerRoutes } from './familyDanger.routes.js';
import { gamesAdminRoutes } from './games.routes.js';
import { blockWhenReadonly, requireAdmin } from './guard.js';
import { healthAdminRoutes, type GameStatus } from './health.routes.js';
import { logsRoutes } from './logs.routes.js';
import { mailAdminRoutes } from './mail.routes.js';
import { overviewRoutes } from './overview.routes.js';
import { retentionAdminRoutes } from './retention.routes.js';
import { siteAdminRoutes } from './site.routes.js';

/**
 * Админка владельца (/api/admin): отдельный вход с кодом из приложения, сводка, семьи и дети, действия.
 * Регистрируется, только когда задан ADMIN_EMAILS (см. adminEnabled); иначе этих маршрутов нет вовсе.
 */
export interface AdminOptions {
  catalog: GameManifest[];
  gameTables: GameTable[];
  games: GameStatus[];
}

export const adminRoutes: FastifyPluginAsync<AdminOptions> = async (app, opts) => {
  app.decorateRequest('admin', null);
  // Ответы админки не кешируются и не индексируются.
  app.addHook('onSend', async (_req, reply) => {
    reply.header('Cache-Control', 'no-store').header('X-Robots-Tag', 'noindex, nofollow');
  });

  await app.register(adminAuthRoutes, { prefix: '/auth' });

  // Всё остальное — только после входа; в режиме «только чтение» изменения отклоняются.
  await app.register(async (secure) => {
    secure.addHook('preHandler', requireAdmin);
    secure.addHook('preHandler', blockWhenReadonly);
    await secure.register(overviewRoutes, { catalog: opts.catalog });
    await secure.register(healthAdminRoutes, { games: opts.games, catalog: opts.catalog });
    await secure.register(familiesRoutes, { gameTables: opts.gameTables });
    await secure.register(familyActionsRoutes, { gameTables: opts.gameTables });
    await secure.register(familyDangerRoutes);
    await secure.register(adminChildrenRoutes, { gameTables: opts.gameTables });
    await secure.register(gamesAdminRoutes, { catalog: opts.catalog, games: opts.games });
    await secure.register(mailAdminRoutes);
    await secure.register(logsRoutes);
    await secure.register(retentionAdminRoutes);
    await secure.register(siteAdminRoutes);
  });
};
