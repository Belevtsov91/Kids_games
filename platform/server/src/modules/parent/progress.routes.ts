import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { levelsByGame, summarizeSkills, type SkillEvent } from '../progress/skills.js';
import { ownsChild, requireParent } from './parentSession.js';

// Кабинет: «Чему научился» — навыки по ответам в играх, пройденные уровни и наклейки.

const params = { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } } as const;
const query = { type: 'object', properties: { days: { type: 'integer', enum: [7, 30, 90] } } } as const;

/** События ребёнка за последние days дней (не больше 5000 — этого с запасом хватает на сводку). */
export async function eventsOf(childId: string, days: number): Promise<SkillEvent[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await db()
    .from('ig_play_events')
    .select('game_id, kind, name, ok, created_at')
    .eq('child_id', childId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data ?? []) as SkillEvent[];
}

export const progressParentRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireParent);

  app.get<{ Params: { id: string }; Querystring: { days?: number } }>(
    '/children/:id/skills',
    { schema: { params, querystring: query } },
    async (req, reply) => {
      if (!(await ownsChild(req.session!.parentId, req.params.id))) return reply.code(404).send({ error: 'Профиль не найден' });
      const events = await eventsOf(req.params.id, req.query.days ?? 30);
      const { data: stickers, error } = await db()
        .from('ig_stickers')
        .select('game_id, sticker, earned_at')
        .eq('child_id', req.params.id)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return {
        skills: summarizeSkills(events),
        levels: levelsByGame(events),
        stickers: (stickers ?? []).map((s) => ({ gameId: s.game_id, sticker: s.sticker, earnedAt: s.earned_at })),
      };
    },
  );
};
