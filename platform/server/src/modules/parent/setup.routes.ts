import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { hashPassword } from '../auth/password.js';
import { safeZone } from '../kid/timeRules.js';
import { PIN_REQUIRED_AGE } from '../children/profileRules.js';
import { isWeakPin } from './gate.js';
import { ownsChild, requireLogin, requireParent } from './parentSession.js';
import type { GameTable } from './index.js';
import { exportFamily } from './exportData.js';

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

const exportQuery = { type: 'object', properties: { child: { type: 'string', format: 'uuid' } } } as const;

type SetupBody = { childId: string; limit?: number | null; quiet?: boolean; pin?: string; tz?: string };

export const setupRoutes: FastifyPluginAsync<{ gameTables: GameTable[] }> = async (app, opts) => {
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
    // С 7 лет задачу для взрослых ребёнок решит сам: без PIN кабинет и лимит не защищены.
    const { data: child } = await db().from('ig_children').select('age').eq('id', req.body.childId).single();
    if (!req.body.pin && (child?.age ?? 0) >= PIN_REQUIRED_AGE) return reply.code(400).send({ error: 'Нужен PIN', code: 'pinRequired' });
    if (req.body.pin && isWeakPin(req.body.pin)) return reply.code(400).send({ error: 'Слишком простой PIN', code: 'weak' });

    const limit = req.body.limit ?? null;
    const { error } = await db().from('ig_child_settings').upsert(
      {
        child_id: req.body.childId,
        limit_weekday: limit,
        limit_weekend: limit === null ? null : Math.min(600, Math.round(limit * 1.5)),
        quiet_from: req.body.quiet ? '21:00' : null,
        quiet_to: req.body.quiet ? '07:00' : null,
        // Взрослый отказался и от лимита, и от тихих часов — не напоминаем и о перерывах.
        ...(limit === null && !req.body.quiet ? { break_every: 0 } : {}),
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
  app.get<{ Querystring: { child?: string } }>('/export', { preHandler: requireParent, schema: { querystring: exportQuery } }, async (req, reply) => {
    const body = await exportFamily(req.session!.parentId, opts.gameTables, req.query.child);
    if (!body) return reply.code(404).send({ error: 'Профиль не найден' });
    return reply
      .header('Content-Disposition', `attachment; filename="interact-games-${new Date().toISOString().slice(0, 10)}.json"`)
      .type('application/json; charset=utf-8')
      .send(JSON.stringify(body, null, 2));
  });
};
