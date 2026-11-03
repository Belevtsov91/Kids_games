import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import type { GameManifest } from '@ig/sdk/manifest';
import { db } from '../../db/index.js';

// Успехи и сохранения ребёнка из игр (sdk.progress, sdk.cloud). Ребёнок — только из сессии.
// Игра не может выдать наклейку, которой нет в её манифесте, и записать навык, которого у неё нет.

const ID = '^[a-z0-9-]{1,40}$';
const progressBody = {
  type: 'object',
  required: ['gameId'],
  properties: {
    gameId: { type: 'string', pattern: ID },
    events: {
      type: 'array',
      maxItems: 50,
      items: {
        type: 'object',
        required: ['kind', 'name'],
        properties: { kind: { type: 'string', enum: ['level', 'skill'] }, name: { type: 'string', minLength: 1, maxLength: 40 }, ok: { type: 'boolean' } },
        additionalProperties: false,
      },
    },
    stickers: { type: 'array', maxItems: 20, items: { type: 'string', pattern: ID } },
  },
  additionalProperties: false,
} as const;
const cloudParams = {
  type: 'object',
  required: ['gameId', 'key'],
  properties: { gameId: { type: 'string', pattern: ID }, key: { type: 'string', pattern: '^[a-zA-Z0-9:_-]{1,60}$' } },
} as const;
const cloudBody = { type: 'object', required: ['value'], properties: { value: {} } } as const;
const MAX_CLOUD_BYTES = 64 * 1024;

type Body = { gameId: string; events?: { kind: 'level' | 'skill'; name: string; ok?: boolean }[]; stickers?: string[] };

async function requireChild(req: FastifyRequest, reply: FastifyReply) {
  if (!req.session) return reply.code(401).send({ error: 'Нужно войти' });
  if (!req.session.activeChildId) return reply.code(409).send({ error: 'Нужно выбрать ребёнка' });
}

export const progressRoutes: FastifyPluginAsync<{ catalog: GameManifest[] }> = async (app, opts) => {
  const games = new Map(opts.catalog.map((g) => [g.id, g]));
  app.addHook('preHandler', requireChild);

  app.post<{ Body: Body }>('/progress', { schema: { body: progressBody } }, async (req, reply) => {
    const game = games.get(req.body.gameId);
    if (!game) return reply.code(404).send({ error: 'Нет такой игры' });
    const childId = req.session!.activeChildId!;
    const skills = new Set<string>(game.skills ?? []);
    const events = (req.body.events ?? [])
      .filter((e) => e.kind === 'level' || skills.has(e.name))
      .map((e) => ({ child_id: childId, game_id: game.id, kind: e.kind, name: e.name, ok: e.kind === 'skill' ? (e.ok ?? null) : null }));
    if (events.length) {
      const { error } = await db().from('ig_play_events').insert(events);
      if (error) throw error;
    }
    const known = new Set((game.stickers ?? []).map((s) => s.id));
    const stickers = [...new Set(req.body.stickers ?? [])].filter((id) => known.has(id));
    if (stickers.length) {
      const rows = stickers.map((sticker) => ({ child_id: childId, game_id: game.id, sticker }));
      const { error } = await db().from('ig_stickers').upsert(rows, { onConflict: 'child_id,game_id,sticker', ignoreDuplicates: true });
      if (error) throw error;
    }
    return reply.code(204).send();
  });

  /** Альбом: все полученные наклейки. Новые помечены seen=false, пока ребёнок не откроет альбом. */
  app.get('/stickers', async (req) => {
    const { data, error } = await db()
      .from('ig_stickers')
      .select('game_id, sticker, earned_at, seen')
      .eq('child_id', req.session!.activeChildId!)
      .order('earned_at');
    if (error) throw error;
    return { stickers: (data ?? []).map((s) => ({ gameId: s.game_id, sticker: s.sticker, earnedAt: s.earned_at, seen: s.seen })) };
  });

  app.post('/stickers/seen', async (req, reply) => {
    const { error } = await db().from('ig_stickers').update({ seen: true }).eq('child_id', req.session!.activeChildId!).eq('seen', false);
    if (error) throw error;
    return reply.code(204).send();
  });

  app.get<{ Params: { gameId: string; key: string } }>('/cloud/:gameId/:key', { schema: { params: cloudParams } }, async (req, reply) => {
    if (!games.has(req.params.gameId)) return reply.code(404).send({ error: 'Нет такой игры' });
    const { data, error } = await db()
      .from('ig_cloud_saves')
      .select('value')
      .eq('child_id', req.session!.activeChildId!)
      .eq('game_id', req.params.gameId)
      .eq('key', req.params.key)
      .maybeSingle();
    if (error) throw error;
    return { value: data?.value ?? null };
  });

  app.put<{ Params: { gameId: string; key: string }; Body: { value: unknown } }>(
    '/cloud/:gameId/:key',
    { schema: { params: cloudParams, body: cloudBody }, bodyLimit: MAX_CLOUD_BYTES + 1024 },
    async (req, reply) => {
      if (!games.has(req.params.gameId)) return reply.code(404).send({ error: 'Нет такой игры' });
      if (JSON.stringify(req.body.value ?? null).length > MAX_CLOUD_BYTES) return reply.code(413).send({ error: 'Слишком большое сохранение' });
      const { error } = await db().from('ig_cloud_saves').upsert(
        { child_id: req.session!.activeChildId!, game_id: req.params.gameId, key: req.params.key, value: req.body.value ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'child_id,game_id,key' },
      );
      if (error) throw error;
      return reply.code(204).send();
    },
  );
};
