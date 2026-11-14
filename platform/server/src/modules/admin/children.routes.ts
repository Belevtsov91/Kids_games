import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { MAX_CHILDREN } from '../children/children.routes.js';
import { childCount } from '../children/switchGuard.js';
import type { GameTable } from '../parent/index.js';
import { audit } from './audit.js';
import { idParams } from './families.routes.js';
import { confirmDanger, confirmProps, type ConfirmBody } from './guard.js';

// Дети: исправить имя и возраст, вернуть профиль из корзины, сбросить сломанное сохранение одной игры,
// показать фото и рисунки (каждый просмотр — в журнал).
// Лимиты, доступ к играм и просьбы о времени владелец не трогает: это решает родитель.

const patchBody = {
  type: 'object',
  minProperties: 1,
  properties: { name: { type: 'string', minLength: 1, maxLength: 40 }, age: { type: 'integer', minimum: 3, maximum: 15 } },
  additionalProperties: false,
} as const;
const resetBody = {
  type: 'object',
  required: ['gameId', 'confirm', 'code'],
  properties: { gameId: { type: 'string', pattern: '^[a-z0-9-]{1,40}$' }, ...confirmProps },
  additionalProperties: false,
} as const;
const drawingParams = {
  type: 'object',
  required: ['id', 'drawingId'],
  properties: { id: { type: 'string', format: 'uuid' }, drawingId: { type: 'string', format: 'uuid' } },
} as const;

const DRAWINGS = 'ig_game_drawing_drawings';
type P = { Params: { id: string } };

async function childOf(id: string) {
  const { data, error } = await db().from('ig_children').select('id, parent_id, name, age, deleted_at').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export const adminChildrenRoutes: FastifyPluginAsync<{ gameTables: GameTable[] }> = async (app, opts) => {
  const missing = { error: 'Профиль не найден' };

  app.patch<P & { Body: { name?: string; age?: number } }>('/children/:id', { schema: { params: idParams, body: patchBody } }, async (req, reply) => {
    const child = await childOf(req.params.id);
    if (!child) return reply.code(404).send(missing);
    const before: Record<string, unknown> = {}, after: Record<string, unknown> = {}, patch: Record<string, unknown> = {};
    const name = req.body.name?.trim();
    if (name && name !== child.name) Object.assign(patch, { name }), (before.name = child.name), (after.name = name);
    if (req.body.age !== undefined && req.body.age !== child.age) Object.assign(patch, { age: req.body.age }), (before.age = child.age), (after.age = req.body.age);
    if (!Object.keys(patch).length) return reply.code(204).send();
    await audit(req, { action: 'child.update', targetType: 'child', targetId: child.id, before, after });
    const { error } = await db().from('ig_children').update(patch).eq('id', child.id);
    if (error) throw error;
    // Возраст задан вручную: месяц рождения больше не должен его перекрывать.
    if (patch.age !== undefined) await db().from('ig_child_settings').update({ birth_month: null }).eq('child_id', child.id);
    return reply.code(204).send();
  });

  /** Вернуть профиль из корзины со всеми сохранениями. */
  app.post<P>('/children/:id/restore', { schema: { params: idParams } }, async (req, reply) => {
    const child = await childOf(req.params.id);
    if (!child || !child.deleted_at) return reply.code(404).send(missing);
    if ((await childCount(child.parent_id)) >= MAX_CHILDREN) return reply.code(409).send({ error: `У семьи уже ${MAX_CHILDREN} профилей`, code: 'full' });
    await audit(req, { action: 'child.restore', targetType: 'child', targetId: child.id, before: { deletedAt: child.deleted_at }, after: { deletedAt: null } });
    const { error } = await db().from('ig_children').update({ deleted_at: null }).eq('id', child.id);
    if (error) throw error;
    return reply.code(204).send();
  });

  /** Сбросить сохранение одной игры у ребёнка: облако платформы и таблицы самой игры. Вернуть нельзя. */
  app.post<P & { Body: ConfirmBody & { gameId: string } }>('/children/:id/saves/reset', { schema: { params: idParams, body: resetBody } }, async (req, reply) => {
    const child = await childOf(req.params.id);
    if (!child) return reply.code(404).send(missing);
    if (!(await confirmDanger(req, reply, 'СБРОСИТЬ'))) return reply;
    const { gameId } = req.body;
    const tables = opts.gameTables.filter((t) => t.gameId === gameId).map((t) => t.table);
    await audit(req, { action: 'child.saveReset', targetType: 'child', targetId: child.id, after: { gameId, tables } });
    const { error } = await db().from('ig_cloud_saves').delete().eq('child_id', child.id).eq('game_id', gameId);
    if (error) throw error;
    for (const table of tables) {
      const { error: tError } = await db().from(table).delete().eq('child_id', child.id);
      if (tError) throw tError;
    }
    return reply.code(204).send();
  });

  /** Фото ребёнка — только по клику; просмотр записывается в журнал. */
  app.get<P>('/children/:id/photo', { schema: { params: idParams } }, async (req, reply) => {
    const { data, error } = await db().from('ig_child_settings').select('photo').eq('child_id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data?.photo) return reply.code(404).send({ error: 'Фото нет' });
    await audit(req, { action: 'child.photoViewed', targetType: 'child', targetId: req.params.id });
    return { photo: data.photo };
  });

  /** Фото взрослого — так же, с записью в журнал. */
  app.get<P>('/families/:id/photo', { schema: { params: idParams } }, async (req, reply) => {
    const { data, error } = await db().from('ig_parent_settings').select('photo').eq('parent_id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data?.photo) return reply.code(404).send({ error: 'Фото нет' });
    await audit(req, { action: 'family.photoViewed', targetType: 'parent', targetId: req.params.id });
    return { photo: data.photo };
  });

  /** Список рисунков без картинок: название и дата. */
  app.get<P>('/children/:id/drawings', { schema: { params: idParams } }, async (req) => {
    const { data, error } = await db().from(DRAWINGS).select('id, title, created_at').eq('child_id', req.params.id).order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    return data ?? [];
  });

  /** Один рисунок — по клику, с записью в журнал. */
  app.get<{ Params: { id: string; drawingId: string } }>('/children/:id/drawings/:drawingId', { schema: { params: drawingParams } }, async (req, reply) => {
    const { data, error } = await db().from(DRAWINGS).select('image, title').eq('child_id', req.params.id).eq('id', req.params.drawingId).maybeSingle();
    if (error) throw error;
    if (!data) return reply.code(404).send({ error: 'Рисунок не найден' });
    await audit(req, { action: 'child.drawingViewed', targetType: 'child', targetId: req.params.id, after: { drawingId: req.params.drawingId } });
    return { image: data.image, title: data.title };
  });
};
