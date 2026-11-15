import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { zoneOf } from './childData.js';
import { localNow } from './timeRules.js';
import { giftsOf, MAX_CANDIDATES, pickGame, QUEST_SECONDS, streakOf } from './quest.js';

// GET /api/kid/quest: задание дня ребёнка. Оболочка присылает игры, которые ребёнку сейчас доступны
// (по возрасту, не закрытые взрослым и владельцем); сервер выбирает одну и запоминает её на весь день.

const query = {
  type: 'object',
  properties: {
    tz: { type: 'string', maxLength: 64 },
    games: { type: 'string', maxLength: 2000, pattern: '^[a-z0-9,-]*$' },
  },
} as const;

export const questRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { tz?: string; games?: string } }>('/quest', { schema: { querystring: query } }, async (req) => {
    const childId = req.session!.activeChildId!;
    const day = localNow(new Date(), await zoneOf(req.session!.parentId, req.query.tz)).day;
    const { data: rows, error } = await db().from('ig_daily_quests').select('day, game_id, done_at').eq('child_id', childId).order('day', { ascending: false }).limit(400);
    if (error) throw error;
    const history = rows ?? [];
    let today = history.find((r) => r.day === day) ?? null;

    if (!today) {
      const candidates = (req.query.games ?? '').split(',').filter((g) => /^[a-z0-9-]{1,40}$/.test(g)).slice(0, MAX_CANDIDATES);
      const gameId = pickGame(candidates, childId, day, history[0]?.game_id);
      if (gameId) {
        const { error: insError } = await db().from('ig_daily_quests').upsert({ child_id: childId, day, game_id: gameId }, { onConflict: 'child_id,day', ignoreDuplicates: true });
        if (insError) throw insError;
        const { data: saved } = await db().from('ig_daily_quests').select('day, game_id, done_at').eq('child_id', childId).eq('day', day).maybeSingle();
        today = saved ?? { day, game_id: gameId, done_at: null };
        history.unshift(today);
      }
    }

    let seconds = 0;
    if (today) {
      const { data: play } = await db().from('ig_play_daily').select('seconds').eq('child_id', childId).eq('day', day).eq('game_id', today.game_id).maybeSingle();
      seconds = play?.seconds ?? 0;
      if (!today.done_at && seconds >= QUEST_SECONDS) {
        const doneAt = new Date().toISOString();
        const { error: upError } = await db().from('ig_daily_quests').update({ done_at: doneAt }).eq('child_id', childId).eq('day', day).is('done_at', null);
        if (upError) throw upError;
        today.done_at = doneAt;
      }
    }

    const doneDays = history.filter((r) => r.done_at).map((r) => r.day as string);
    return {
      day,
      gameId: today?.game_id ?? null,
      done: Boolean(today?.done_at),
      seconds: Math.min(seconds, QUEST_SECONDS),
      need: QUEST_SECONDS,
      streak: streakOf(doneDays, day),
      total: doneDays.length,
      ...giftsOf(doneDays.length),
    };
  });
};
