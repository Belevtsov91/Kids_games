import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env.js';
import { db } from '../../db/index.js';
import { verifyPassword } from '../auth/password.js';
import { checkAnswer, issueToken, makeChallenge } from './gate.js';
import { parentStatus, requireLogin, setUnlocked, UNLOCK_MS } from './parentSession.js';
import { safeZone } from '../kid/timeRules.js';

// Вход в кабинет: задача для взрослых, затем PIN, если он задан.
// 5 неверных PIN подряд — PIN заблокирован на 15 минут, войти можно только паролем.

const PIN_TRIES = 5;
const PIN_LOCK_MS = 15 * 60 * 1000;
const strictLimit = { rateLimit: { max: 30, timeWindow: '15 minutes' } };

const answerBody = {
  type: 'object',
  required: ['token', 'answer'],
  properties: {
    token: { type: 'string', maxLength: 200 },
    answer: { type: 'integer', minimum: -100000, maximum: 100000 },
    pin: { type: 'string', pattern: '^\\d{4}$' },
    password: { type: 'string', minLength: 1, maxLength: 72 },
    tz: { type: 'string', maxLength: 64 },
  },
  additionalProperties: false,
} as const;

interface AnswerBody {
  token: string;
  answer: number;
  pin?: string;
  password?: string;
  tz?: string;
}

async function pinRow(parentId: string) {
  const { data, error } = await db()
    .from('ig_parent_settings')
    .select('pin_hash, pin_failed, pin_locked_until, timezone')
    .eq('parent_id', parentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export const gateRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireLogin);
  const secret = env.sessionEncryptionKey ?? '';

  app.get('/status', async (req) => {
    const [until, pin] = await Promise.all([parentStatus(req), pinRow(req.session!.parentId)]);
    return { unlocked: Boolean(until), until: until?.toISOString() ?? null, hasPin: Boolean(pin?.pin_hash) };
  });

  app.post('/challenge', async (req) => {
    const { challenge, answer } = makeChallenge();
    return { challenge, token: issueToken(secret, answer, req.session!.parentId) };
  });

  /** Только проверить ответ (перед шагом PIN). Кабинет не открывает. */
  app.post<{ Body: AnswerBody }>('/check', { schema: { body: answerBody }, config: strictLimit }, async (req, reply) => {
    const result = checkAnswer(secret, req.body.token, req.body.answer, req.session!.parentId);
    if (result !== 'ok') return reply.code(400).send({ error: 'Ответ неверный', code: result });
    return { ok: true };
  });

  app.post<{ Body: AnswerBody }>('/unlock', { schema: { body: answerBody }, config: strictLimit }, async (req, reply) => {
    const parentId = req.session!.parentId;
    const result = checkAnswer(secret, req.body.token, req.body.answer, parentId);
    if (result !== 'ok') return reply.code(400).send({ error: 'Ответ неверный', code: result });

    const pin = await pinRow(parentId);
    if (pin?.pin_hash) {
      // «Забыли PIN?» — вместо PIN подходит пароль аккаунта.
      if (req.body.password) {
        const { data, error } = await db().from('ig_parents').select('password_hash').eq('id', parentId).single();
        if (error) throw error;
        if (!(await verifyPassword(req.body.password, data.password_hash))) {
          return reply.code(400).send({ error: 'Неверный пароль', code: 'password' });
        }
      } else {
        const lockedUntil = pin.pin_locked_until ? new Date(pin.pin_locked_until) : null;
        if (lockedUntil && lockedUntil.getTime() > Date.now()) {
          return reply.code(429).send({ error: 'PIN заблокирован', code: 'pinLocked', until: lockedUntil.toISOString() });
        }
        if (!req.body.pin) return reply.code(400).send({ error: 'Нужен PIN', code: 'pinNeeded' });
        if (!(await verifyPassword(req.body.pin, pin.pin_hash))) {
          const failed = pin.pin_failed + 1;
          const locked = failed >= PIN_TRIES;
          await db()
            .from('ig_parent_settings')
            .update({
              pin_failed: locked ? 0 : failed,
              pin_locked_until: locked ? new Date(Date.now() + PIN_LOCK_MS).toISOString() : null,
            })
            .eq('parent_id', parentId);
          return reply.code(400).send({ error: 'Неверный PIN', code: locked ? 'pinLocked' : 'pin', left: PIN_TRIES - failed });
        }
      }
    }

    // Успех: сбросить счётчик PIN и запомнить часовой пояс семьи, если его ещё нет.
    const patch: Record<string, unknown> = { parent_id: parentId, pin_failed: 0, pin_locked_until: null };
    if (!pin?.timezone && req.body.tz) patch.timezone = safeZone(req.body.tz);
    const { error } = await db().from('ig_parent_settings').upsert(patch, { onConflict: 'parent_id' });
    if (error) throw error;
    const until = new Date(Date.now() + UNLOCK_MS);
    await setUnlocked(req, until);
    return { unlocked: true, until: until.toISOString() };
  });

  /** «Закрыть кабинет» и «Отдать ребёнку». */
  app.post('/lock', async (req, reply) => {
    await setUnlocked(req, null);
    return reply.code(204).send();
  });
};
