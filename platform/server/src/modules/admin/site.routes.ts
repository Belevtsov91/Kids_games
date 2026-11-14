import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { MAIL_LANGS } from '../../mail/texts.js';
import { audit } from './audit.js';
import { soft } from './data.js';
import { setFlag, siteFlags } from './flags.js';
import { confirmDanger, confirmProps, type ConfirmBody } from './guard.js';

// Управление сайтом: режим обслуживания, объявление для родителей, «только чтение» админки, «Что нового».

const texts = (max: number) => ({
  type: 'object',
  properties: Object.fromEntries(MAIL_LANGS.map((l) => [l, { type: 'string', maxLength: max }])),
  additionalProperties: false,
}) as const;

const maintenanceBody = { type: 'object', required: ['on'], properties: { on: { type: 'boolean' }, ...confirmProps }, additionalProperties: false } as const;
const bannerBody = { type: 'object', required: ['banner'], properties: { banner: texts(300) }, additionalProperties: false } as const;
const readonlyBody = { type: 'object', required: ['on'], properties: { on: { type: 'boolean' } }, additionalProperties: false } as const;
const newsBody = {
  type: 'object',
  required: ['day', 'titles', 'bodies'],
  properties: { day: { type: 'string', format: 'date' }, titles: texts(120), bodies: texts(2000), published: { type: 'boolean' } },
  additionalProperties: false,
} as const;
const idParams = { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } } as const;

type Texts = Partial<Record<(typeof MAIL_LANGS)[number], string>>;
interface NewsBody { day: string; titles: Texts; bodies: Texts; published?: boolean }

/** Пустые строки объявления убираем: «нет текста на этом языке» — это отсутствие ключа. */
const tidy = (value: Texts) => Object.fromEntries(Object.entries(value).map(([k, v]) => [k, (v ?? '').trim()]).filter(([, v]) => v)) as Texts;

export const siteAdminRoutes: FastifyPluginAsync = async (app) => {
  app.get('/site', async () => siteFlags(true));

  /** Закрыть сайт на обслуживание — опасно (слово и код). Открыть — обычное действие. */
  app.post<{ Body: ConfirmBody & { on: boolean } }>('/site/maintenance', { schema: { body: maintenanceBody } }, async (req, reply) => {
    if (req.body.on && !(await confirmDanger(req, reply, 'ЗАКРЫТЬ'))) return reply;
    await audit(req, { action: 'site.maintenance', targetType: 'site', before: (await siteFlags(true)).maintenance, after: req.body.on });
    await setFlag('maintenance', req.body.on);
    return reply.code(204).send();
  });

  /** Объявление для родителей; пустой объект снимает его. */
  app.put<{ Body: { banner: Texts } }>('/site/banner', { schema: { body: bannerBody } }, async (req, reply) => {
    const banner = tidy(req.body.banner);
    await audit(req, { action: 'site.banner', targetType: 'site', before: (await siteFlags(true)).banner, after: banner });
    await setFlag('banner', banner);
    return reply.code(204).send();
  });

  /** Режим «только чтение»: пока включён, любые изменения из админки отклоняются. Сам переключатель работает всегда. */
  app.post<{ Body: { on: boolean } }>('/site/readonly', { schema: { body: readonlyBody } }, async (req, reply) => {
    await audit(req, { action: 'admin.readonly', targetType: 'admin', after: req.body.on });
    await setFlag('admin_readonly', req.body.on);
    return reply.code(204).send();
  });

  app.get('/news', async () =>
    soft(async () => {
      const { data, error } = await db().from('ig_news').select('id, day, titles, bodies, published, updated_at').order('day', { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    }, []),
  );

  app.post<{ Body: NewsBody }>('/news', { schema: { body: newsBody } }, async (req, reply) => {
    const row = { day: req.body.day, titles: tidy(req.body.titles), bodies: tidy(req.body.bodies), published: req.body.published ?? false };
    const { data, error } = await db().from('ig_news').insert(row).select('id').single();
    if (error) throw error;
    await audit(req, { action: 'news.create', targetType: 'news', targetId: data.id, after: row });
    return reply.code(201).send({ id: data.id });
  });

  app.put<{ Params: { id: string }; Body: NewsBody }>('/news/:id', { schema: { params: idParams, body: newsBody } }, async (req, reply) => {
    const { data: before, error: rError } = await db().from('ig_news').select('day, titles, bodies, published').eq('id', req.params.id).maybeSingle();
    if (rError) throw rError;
    if (!before) return reply.code(404).send({ error: 'Запись не найдена' });
    const row = { day: req.body.day, titles: tidy(req.body.titles), bodies: tidy(req.body.bodies), published: req.body.published ?? false, updated_at: new Date().toISOString() };
    await audit(req, { action: 'news.update', targetType: 'news', targetId: req.params.id, before, after: row });
    const { error } = await db().from('ig_news').update(row).eq('id', req.params.id);
    if (error) throw error;
    return reply.code(204).send();
  });

  app.delete<{ Params: { id: string } }>('/news/:id', { schema: { params: idParams } }, async (req, reply) => {
    const { data: before } = await db().from('ig_news').select('day, titles').eq('id', req.params.id).maybeSingle();
    if (!before) return reply.code(404).send({ error: 'Запись не найдена' });
    await audit(req, { action: 'news.delete', targetType: 'news', targetId: req.params.id, before });
    const { error } = await db().from('ig_news').delete().eq('id', req.params.id);
    if (error) throw error;
    return reply.code(204).send();
  });
};
