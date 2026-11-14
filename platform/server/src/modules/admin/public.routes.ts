import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { soft } from './data.js';
import { siteFlags } from './flags.js';

// То, что основной сайт читает без входа: режим обслуживания, объявление, выключенные игры, «Что нового».
// Работает и без админки: без миграции 008 отдаёт «всё как обычно».

export const sitePublicRoutes: FastifyPluginAsync = async (app) => {
  app.get('/site', async () => {
    const flags = await siteFlags();
    return { maintenance: flags.maintenance, banner: flags.banner, disabledGames: flags.disabled_games };
  });

  /** Опубликованные записи «Что нового», новые сверху. */
  app.get('/site/news', async () =>
    soft(async () => {
      const { data, error } = await db().from('ig_news').select('id, day, titles, bodies').eq('published', true).order('day', { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    }, []),
  );
};
