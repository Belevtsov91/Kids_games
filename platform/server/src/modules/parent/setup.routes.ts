import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { hashPassword } from '../auth/password.js';
import { safeZone } from '../kid/timeRules.js';
import { isWeakPin } from './gate.js';
import { ownsChild, requireLogin, requireParent } from './parentSession.js';

// Первая настройка сразу после регистрации (/setup) и выгрузка всех данных семьи (GDPR).
// Настройка работает без задачи для взрослых, но только один раз и только в первые сутки после регистрации.

const SETUP_WINDOW_MS = 24 * 60 * 60 * 1000;
const setupBody = {
  type: 'object',
  required: ['childId'],
  properties: {
    childId: { type: 'string', format: 'uuid' },
    limit: { type: ['integer', 'null'], minimum: 5, maximum: 600 },
    quiet: { type: 'boolean' },
    pin: { type: 'string', pattern: '^\\d{4}$' },
    tz: { type: 'string', maxLength: 64 },
  },
  additionalProperties: false,
} as const;

type SetupBody = { childId: string; limit?: number | null; quiet?: boolean; pin?: string; tz?: string };

export const setupRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: SetupBody }>('/setup', { preHandler: requireLogin, schema: { body: setupBody } }, async (req, reply) => {
    const parentId = req.session!.parentId;
    const [{ data: parent }, { data: settings }] = await Promise.all([
      db().from('ig_parents').select('created_at').eq('id', parentId).single(),
      db().from('ig_parent_settings').select('onboarded').eq('parent_id', parentId).maybeSingle(),
    ]);
    if (settings?.onboarded || !parent || Date.now() - new Date(parent.created_at).getTime() > SETUP_WINDOW_MS) {
      return reply.code(409).send({ error: 'Настройка уже пройдена' });
    }
    if (!(await ownsChild(parentId, req.body.childId))) return reply.code(404).send({ error: 'Профиль не найден' });
    if (req.body.pin && isWeakPin(req.body.pin)) return reply.code(400).send({ error: 'Слишком простой PIN', code: 'weak' });

    const limit = req.body.limit ?? null;
    const { error } = await db().from('ig_child_settings').upsert(
      {
        child_id: req.body.childId,
        limit_weekday: limit,
        limit_weekend: limit === null ? null : Math.min(600, Math.round(limit * 1.5)),
        quiet_from: req.body.quiet ? '21:00' : null,
        quiet_to: req.body.quiet ? '07:00' : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'child_id' },
    );
    if (error) throw error;
    const { error: pError } = await db().from('ig_parent_settings').upsert(
      {
        parent_id: parentId,
        onboarded: true,
        timezone: req.body.tz ? safeZone(req.body.tz) : null,
        ...(req.body.pin ? { pin_hash: await hashPassword(req.body.pin), pin_failed: 0 } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'parent_id' },
    );
    if (pError) throw pError;
    return reply.code(204).send();
  });

  /** Все данные семьи на платформе одним JSON. Хеши пароля, PIN и токенов не отдаём. */
  app.get('/export', { preHandler: requireParent }, async (req, reply) => {
    const parentId = req.session!.parentId;
    const one = async (table: string, columns: string, key: string, value: string | string[]) => {
      const q = db().from(table).select(columns);
      const { data, error } = Array.isArray(value) ? await q.in(key, value.length ? value : ['00000000-0000-0000-0000-000000000000']) : await q.eq(key, value);
      if (error) throw error;
      return data ?? [];
    };
    const parent = await one('ig_parents', 'id, email, display_name, created_at', 'id', parentId);
    const children = (await one('ig_children', 'id, name, age, avatar, created_at', 'parent_id', parentId)) as unknown as { id: string }[];
    const ids = children.map((c) => c.id);
    const body = {
      exportedAt: new Date().toISOString(),
      parent: parent[0] ?? null,
      parentSettings: (await one('ig_parent_settings', 'photo, timezone, weekly_report, notify_requests, mail_locale, onboarded', 'parent_id', parentId))[0] ?? null,
      helpers: await one('ig_helpers', 'name, email, created_at, last_used_at', 'parent_id', parentId),
      children,
      childSettings: await one('ig_child_settings', '*', 'child_id', ids),
      gameAccess: await one('ig_child_game_access', '*', 'child_id', ids),
      playDaily: await one('ig_play_daily', '*', 'child_id', ids),
      timeRequests: await one('ig_time_requests', '*', 'child_id', ids),
      playEvents: await one('ig_play_events', 'child_id, game_id, kind, name, ok, created_at', 'child_id', ids),
      stickers: await one('ig_stickers', '*', 'child_id', ids),
      cloudSaves: await one('ig_cloud_saves', '*', 'child_id', ids),
    };
    return reply
      .header('Content-Disposition', `attachment; filename="interact-games-${new Date().toISOString().slice(0, 10)}.json"`)
      .type('application/json; charset=utf-8')
      .send(JSON.stringify(body, null, 2));
  });
};
