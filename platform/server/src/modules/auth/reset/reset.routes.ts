import { createHash, randomBytes } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../../config/env.js';
import { db } from '../../../db/index.js';
import { mailEnabled, sendMail } from '../../../mail/mailer.js';
import { hashPassword } from '../password.js';
import { createSession } from '../session.js';
import { resetPasswordMail } from './email/template.js';
import { MAIL_LOCALES, mailLocale } from './email/text.js';

// Восстановление пароля: «Забыли пароль?» → письмо со ссылкой → новый пароль.
// В письме случайный токен (32 байта), в БД только его SHA-256. Ссылка одноразовая и живёт TTL_MIN минут.
// Ссылка ведёт на /reset#<токен>: часть после # браузер не отправляет ни серверу, ни в Referer.

export const RESET_TTL_MIN = 30;
const TOKEN_RE = '^[A-Za-z0-9_-]{43}$';

export const hashResetToken = (token: string) => createHash('sha256').update(token).digest('hex');

const forgotBody = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email', maxLength: 254 },
    locale: { type: 'string', enum: [...MAIL_LOCALES] },
  },
  additionalProperties: false,
} as const;

const tokenProp = { type: 'string', pattern: TOKEN_RE } as const;
const checkBody = { type: 'object', required: ['token'], properties: { token: tokenProp }, additionalProperties: false } as const;
const resetBody = {
  type: 'object',
  required: ['token', 'password'],
  properties: { token: tokenProp, password: { type: 'string', minLength: 8, maxLength: 72 } },
  additionalProperties: false,
} as const;

// Письма дороже входа: не больше 5 запросов с одного IP за 15 минут.
const mailLimit = { rateLimit: { max: 5, timeWindow: '15 minutes' } };
const strictLimit = { rateLimit: { max: 10, timeWindow: '15 minutes' } };
const GONE = { error: 'Ссылка устарела или уже использована' };

/** Живой токен → id родителя, иначе null. */
async function findReset(token: string): Promise<string | null> {
  const { data, error } = await db()
    .from('ig_password_resets')
    .select('parent_id, expires_at')
    .eq('token_hash', hashResetToken(token))
    .maybeSingle();
  if (error) throw error;
  if (!data || new Date(data.expires_at).getTime() <= Date.now()) return null;
  return data.parent_id as string;
}

export const resetRoutes: FastifyPluginAsync = async (app) => {
  /**
   * Отправить письмо со ссылкой. Ответ всегда один и тот же, есть такая почта или нет:
   * так нельзя узнать, кто зарегистрирован. Письмо уходит в фоне, чтобы и по времени ответа это не угадать.
   */
  app.post<{ Body: { email: string; locale?: string } }>(
    '/forgot',
    { schema: { body: forgotBody }, config: mailLimit },
    async (req, reply) => {
      if (!mailEnabled && env.isProduction) return reply.code(503).send({ error: 'Почта временно недоступна' });
      const email = req.body.email.trim().toLowerCase();
      const locale = mailLocale(req.body.locale);
      const log = req.log;

      void (async () => {
        const { data: parent, error } = await db().from('ig_parents').select('id, display_name').eq('email', email).maybeSingle();
        if (error) throw error;
        if (!parent) return;
        const token = randomBytes(32).toString('base64url');
        const now = Date.now();
        // У родителя одна живая ссылка: старые удаляем, заодно и просроченные у всех.
        await db().from('ig_password_resets').delete().eq('parent_id', parent.id);
        await db().from('ig_password_resets').delete().lt('expires_at', new Date(now).toISOString());
        const { error: insertError } = await db()
          .from('ig_password_resets')
          .insert({ token_hash: hashResetToken(token), parent_id: parent.id, expires_at: new Date(now + RESET_TTL_MIN * 60_000).toISOString() });
        if (insertError) throw insertError;

        const url = `${env.appUrl}/reset#${token}`;
        if (!mailEnabled) {
          // Только в разработке: почта не настроена, ссылку можно взять из лога сервера.
          log.warn({ url }, 'Почта не настроена (SMTP_* / BREVO_API_KEY): ссылка для сброса пароля');
          return;
        }
        const mail = resetPasswordMail({ locale, name: parent.display_name, url, minutes: RESET_TTL_MIN });
        await sendMail({ to: email, ...mail });
        log.info('Письмо для сброса пароля отправлено');
      })().catch((err) => log.error({ err }, 'Не удалось отправить письмо для сброса пароля'));

      return { ok: true };
    },
  );

  /** Страница сброса заранее узнаёт, жива ли ссылка, чтобы не просить пароль зря. */
  app.post<{ Body: { token: string } }>('/reset/check', { schema: { body: checkBody }, config: strictLimit }, async (req, reply) => {
    if (!(await findReset(req.body.token))) return reply.code(410).send(GONE);
    return { ok: true };
  });

  /** Новый пароль: токен одноразовый, все старые сессии закрываются, на этом устройстве сразу входим. */
  app.post<{ Body: { token: string; password: string } }>(
    '/reset',
    { schema: { body: resetBody }, config: strictLimit },
    async (req, reply) => {
      const tokenHash = hashResetToken(req.body.token);
      // Сначала удаляем токен: если две вкладки отправят форму одновременно, пройдёт только одна.
      const { data: used, error } = await db()
        .from('ig_password_resets')
        .delete()
        .eq('token_hash', tokenHash)
        .gt('expires_at', new Date().toISOString())
        .select('parent_id');
      if (error) throw error;
      const parentId = used?.[0]?.parent_id as string | undefined;
      if (!parentId) return reply.code(410).send(GONE);

      const { error: updateError } = await db()
        .from('ig_parents')
        .update({ password_hash: await hashPassword(req.body.password) })
        .eq('id', parentId);
      if (updateError) throw updateError;
      await db().from('ig_password_resets').delete().eq('parent_id', parentId);
      // Кто-то мог войти со старым паролем: выходим со всех устройств.
      await db().from('ig_sessions').delete().eq('parent_id', parentId);
      await createSession(reply, parentId);
      return { ok: true };
    },
  );
};
