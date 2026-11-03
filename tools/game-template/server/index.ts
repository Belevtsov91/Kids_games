import type { FastifyPluginAsync } from 'fastify';
import { childIdOf, requireChild, type GameServerOptions } from '@ig/sdk/server';

// Серверная часть игры: платформа подключит её под /api/games/__GAME_ID__.
// Не нужна — удалите папку server/.
//
// БД: платформа передаёт `opts.db` — клиент Supabase, который пускает только в таблицы
// этой игры `ig_game_<id>_*` (дефисы в id → `_`). Таблицы описываются в server/migrations/*.sql,
// с внешним ключом child_id → public.ig_children(id) on delete cascade.
// `opts.db` равен null в тестах и без Supabase — тогда держите данные в памяти
// (пример: games/who-lives-where/server/repository.ts).
const server: FastifyPluginAsync<GameServerOptions> = async (app, _opts) => {
  app.get('/hello', async () => ({ game: '__GAME_ID__' }));

  // Данные ребёнка: кто он, берём только из сессии, а не из запроса.
  app.get('/me', { preHandler: requireChild }, async (req) => ({ childId: childIdOf(req) }));
};

export default server;
