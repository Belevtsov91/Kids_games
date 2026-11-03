import type { FastifyPluginAsync } from 'fastify';
import { CHILD_EXTRA, childView, type ChildExtra } from '../children/childView.js';
import { db } from '../../db/index.js';
import { DUMMY_HASH, hashPassword, verifyPassword } from './password.js';
import { createSession, destroySession, sessionsEnabled } from './session.js';
import { resetRoutes } from './reset/reset.routes.js';

// Вход родителя. Пароль приходит только в теле запроса, хешируется здесь и нигде не логируется.

const email = { type: 'string', format: 'email', maxLength: 254 } as const;

const registerBody = {
  type: 'object',
  required: ['email', 'password', 'name'],
  properties: {
    email,
    password: { type: 'string', minLength: 8, maxLength: 72 },
    name: { type: 'string', minLength: 1, maxLength: 40, pattern: '\\S' },
  },
  additionalProperties: false,
} as const;

const loginBody = {
  type: 'object',
  required: ['email', 'password'],
  properties: { email, password: { type: 'string', minLength: 1, maxLength: 72 } },
  additionalProperties: false,
} as const;

// Попытки входа и регистрации ограничены строже остальных запросов.
const strictLimit = { rateLimit: { max: 10, timeWindow: '15 minutes' } };

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (_req, reply) => {
    if (!sessionsEnabled) return reply.code(503).send({ error: 'Вход временно недоступен' });
  });

  // «Забыли пароль?»: письмо со ссылкой и новый пароль.
  await app.register(resetRoutes);

  app.post<{ Body: { email: string; password: string; name: string } }>(
    '/register',
    { schema: { body: registerBody }, config: strictLimit },
    async (req, reply) => {
      const { data, error } = await db()
        .from('ig_parents')
        .insert({
          email: normalizeEmail(req.body.email),
          password_hash: await hashPassword(req.body.password),
          display_name: req.body.name.trim(),
        })
        .select('id')
        .single();
      if (error) {
        // 23505 — почта уже занята. Не уточняем это, чтобы перебором нельзя было собирать чужие почты.
        if (error.code === '23505') return reply.code(409).send({ error: 'Не получилось зарегистрироваться с этой почтой' });
        throw error;
      }
      await createSession(reply, data.id);
      return reply.code(201).send({ ok: true });
    },
  );

  app.post<{ Body: { email: string; password: string } }>(
    '/login',
    { schema: { body: loginBody }, config: strictLimit },
    async (req, reply) => {
      const { data: parent, error } = await db()
        .from('ig_parents')
        .select('id, password_hash')
        .eq('email', normalizeEmail(req.body.email))
        .maybeSingle();
      if (error) throw error;
      const ok = await verifyPassword(req.body.password, parent?.password_hash ?? DUMMY_HASH);
      if (!parent || !ok) return reply.code(401).send({ error: 'Неверная почта или пароль' });

      await createSession(reply, parent.id);
      return { ok: true };
    },
  );

  app.post('/logout', async (req, reply) => {
    await destroySession(req, reply);
    return reply.code(204).send();
  });

  /**
   * Удалить аккаунт родителя насовсем. Профили детей, сохранения всех игр и сессии
   * удаляются каскадом в БД (on delete cascade). Проверку «только взрослый» делает клиент.
   */
  app.delete('/account', { config: strictLimit }, async (req, reply) => {
    if (!req.session) return reply.code(401).send({ error: 'Нужно войти' });
    const { error } = await db().from('ig_parents').delete().eq('id', req.session.parentId);
    if (error) throw error;
    await destroySession(req, reply);
    return reply.code(204).send();
  });

  /** Кто вошёл: родитель, его дети и выбранный ребёнок. 401 — не вошёл. */
  app.get('/me', async (req, reply) => {
    if (!req.session) return reply.code(401).send({ error: 'Нужно войти' });
    const [{ data: parent, error: parentError }, { data: children, error: childrenError }] = await Promise.all([
      db().from('ig_parents').select('id, display_name').eq('id', req.session.parentId).single(),
      db()
        .from('ig_children')
        .select('id, name, age, avatar')
        .eq('parent_id', req.session.parentId)
        .order('created_at'),
    ]);
    if (parentError) throw parentError;
    if (childrenError) throw childrenError;
    // Фото и язык ребёнка задаёт родитель в кабинете (ig_child_settings).
    const ids = (children ?? []).map((c) => c.id);
    const [{ data: extra, error: extraError }, { data: own, error: ownError }] = await Promise.all([
      ids.length
        ? db().from('ig_child_settings').select(CHILD_EXTRA).in('child_id', ids)
        : Promise.resolve({ data: [] as ChildExtra[], error: null }),
      db().from('ig_parent_settings').select('photo').eq('parent_id', req.session.parentId).maybeSingle(),
    ]);
    if (extraError) throw extraError;
    if (ownError) throw ownError;
    const byId = new Map((extra ?? []).map((e) => [e.child_id, e]));
    return {
      parent: { id: parent.id, name: parent.display_name, photo: own?.photo ?? null },
      children: (children ?? []).map((c) => childView(c, byId.get(c.id) as ChildExtra | undefined)),
      activeChildId: req.session.activeChildId,
    };
  });
};
