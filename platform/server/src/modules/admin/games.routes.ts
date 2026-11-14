import type { FastifyPluginAsync } from 'fastify';
import type { GameManifest } from '@ig/sdk/manifest';
import { audit } from './audit.js';
import { allRows, dayIn, daysBack } from './data.js';
import { setFlag, siteFlags } from './flags.js';
import { confirmDanger, confirmProps, type ConfirmBody } from './guard.js';
import type { GameStatus } from './health.routes.js';

// Игры: каталог со статистикой за период и выключатель «отключить игру для всех».
// Выключенная игра пропадает из каталога, который отдаёт сервер; сохранения детей остаются.

const query = { type: 'object', properties: { days: { type: 'integer', enum: [1, 7, 30, 365] }, tz: { type: 'string', maxLength: 64 } } } as const;
const params = { type: 'object', required: ['id'], properties: { id: { type: 'string', pattern: '^[a-z][a-z0-9-]{0,39}$' } } } as const;
const offBody = { type: 'object', required: ['confirm', 'code'], properties: confirmProps, additionalProperties: false } as const;

export const gamesAdminRoutes: FastifyPluginAsync<{ catalog: GameManifest[]; games: GameStatus[] }> = async (app, opts) => {
  app.get<{ Querystring: { days?: number; tz?: string } }>('/games', { schema: { querystring: query } }, async (req) => {
    const days = req.query.days ?? 7;
    const period = daysBack(dayIn(req.query.tz), days);
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const [plays, events, flags] = await Promise.all([
      allRows<{ child_id: string; game_id: string; seconds: number }>('ig_play_daily', 'child_id, game_id, seconds', (q) => q.gte('day', period[0])),
      allRows<{ game_id: string; kind: string; ok: boolean | null }>('ig_play_events', 'game_id, kind, ok', (q) => q.gte('created_at', since)),
      siteFlags(true),
    ]);
    return opts.catalog.map((g) => {
      const mine = plays.filter((p) => p.game_id === g.id);
      const answers = events.filter((e) => e.game_id === g.id && e.kind === 'skill' && e.ok !== null);
      const status = opts.games.find((s) => s.id === g.id);
      return {
        id: g.id,
        title: g.title,
        emoji: g.emoji,
        kind: g.kind,
        ages: g.ages,
        skills: g.skills ?? [],
        stickers: g.stickers?.length ?? 0,
        hasServer: status?.hasServer ?? false,
        serverOk: status?.serverOk ?? true,
        disabled: flags.disabled_games.includes(g.id),
        minutes: Math.round(mine.reduce((s, p) => s + p.seconds, 0) / 60),
        players: new Set(mine.map((p) => p.child_id)).size,
        levels: events.filter((e) => e.game_id === g.id && e.kind === 'level').length,
        answers: answers.length,
        rightShare: answers.length ? Math.round((answers.filter((a) => a.ok).length / answers.length) * 100) : null,
      };
    });
  });

  /** Выключить игру для всех: опасное действие, нужны слово и код. */
  app.post<{ Params: { id: string }; Body: ConfirmBody }>('/games/:id/disable', { schema: { params, body: offBody } }, async (req, reply) => {
    if (!opts.catalog.some((g) => g.id === req.params.id)) return reply.code(404).send({ error: 'Игра не найдена' });
    if (!(await confirmDanger(req, reply, 'ВЫКЛЮЧИТЬ'))) return reply;
    const before = (await siteFlags(true)).disabled_games;
    const after = [...new Set([...before, req.params.id])];
    await audit(req, { action: 'game.disable', targetType: 'game', targetId: req.params.id, before, after });
    await setFlag('disabled_games', after);
    return reply.code(204).send();
  });

  /** Включить обратно — обычное действие. */
  app.post<{ Params: { id: string } }>('/games/:id/enable', { schema: { params } }, async (req, reply) => {
    const before = (await siteFlags(true)).disabled_games;
    const after = before.filter((id) => id !== req.params.id);
    await audit(req, { action: 'game.enable', targetType: 'game', targetId: req.params.id, before, after });
    await setFlag('disabled_games', after);
    return reply.code(204).send();
  });
};
