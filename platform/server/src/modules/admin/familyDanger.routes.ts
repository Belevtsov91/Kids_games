import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { audit } from './audit.js';
import { idParams } from './families.routes.js';
import { confirmDanger, confirmProps, type ConfirmBody } from './guard.js';

// Опасные действия над аккаунтом семьи: заморозка и удаление с отсрочкой. Нужны слово и код из приложения.
// Удаление не мгновенное: аккаунт замораживается и стирается чисткой через DELETE_DELAY_DAYS дней; до этого можно отменить.

export const DELETE_DELAY_DAYS = 7;
/** На сколько дней «Отложить» отодвигает удаление за неактивность: срок считается от последнего входа. */
const body = { type: 'object', required: ['confirm', 'code'], properties: confirmProps, additionalProperties: false } as const;
type P = { Params: { id: string }; Body: ConfirmBody };

async function stateOf(id: string) {
  const { data, error } = await db().from('ig_parents').select('id, frozen_at, delete_after, last_seen_at, inactive_warned_at').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export const familyDangerRoutes: FastifyPluginAsync = async (app) => {
  const missing = { error: 'Семья не найдена' };

  /** Заморозить: войти нельзя, все сессии закрыты, данные на месте. */
  app.post<P>('/families/:id/freeze', { schema: { params: idParams, body } }, async (req, reply) => {
    const state = await stateOf(req.params.id);
    if (!state) return reply.code(404).send(missing);
    if (!(await confirmDanger(req, reply, 'ЗАМОРОЗИТЬ'))) return reply;
    const frozenAt = new Date().toISOString();
    await audit(req, { action: 'family.freeze', targetType: 'parent', targetId: state.id, before: { frozenAt: state.frozen_at }, after: { frozenAt } });
    const { error } = await db().from('ig_parents').update({ frozen_at: frozenAt }).eq('id', state.id);
    if (error) throw error;
    await db().from('ig_sessions').delete().eq('parent_id', state.id);
    return reply.code(204).send();
  });

  /** Разморозить — обычное действие, без кода. Аккаунт на удалении так не вернуть: сначала отмените удаление. */
  app.post<{ Params: { id: string } }>('/families/:id/unfreeze', { schema: { params: idParams } }, async (req, reply) => {
    const state = await stateOf(req.params.id);
    if (!state) return reply.code(404).send(missing);
    if (state.delete_after) return reply.code(409).send({ error: 'Аккаунт на удалении: сначала отмените удаление', code: 'deleting' });
    await audit(req, { action: 'family.unfreeze', targetType: 'parent', targetId: state.id, before: { frozenAt: state.frozen_at }, after: { frozenAt: null } });
    const { error } = await db().from('ig_parents').update({ frozen_at: null }).eq('id', state.id);
    if (error) throw error;
    return reply.code(204).send();
  });

  /** Удалить аккаунт: заморозка сразу, стирание через 7 дней. */
  app.post<P>('/families/:id/delete', { schema: { params: idParams, body } }, async (req, reply) => {
    const state = await stateOf(req.params.id);
    if (!state) return reply.code(404).send(missing);
    if (!(await confirmDanger(req, reply, 'УДАЛИТЬ'))) return reply;
    const now = new Date();
    const deleteAfter = new Date(now.getTime() + DELETE_DELAY_DAYS * 86_400_000).toISOString();
    await audit(req, { action: 'family.deleteScheduled', targetType: 'parent', targetId: state.id, after: { deleteAfter } });
    const { error } = await db().from('ig_parents').update({ frozen_at: state.frozen_at ?? now.toISOString(), delete_after: deleteAfter }).eq('id', state.id);
    if (error) throw error;
    await db().from('ig_sessions').delete().eq('parent_id', state.id);
    return { deleteAfter };
  });

  /** Отменить удаление: аккаунт снова открыт. */
  app.post<{ Params: { id: string } }>('/families/:id/delete/cancel', { schema: { params: idParams } }, async (req, reply) => {
    const state = await stateOf(req.params.id);
    if (!state) return reply.code(404).send(missing);
    await audit(req, { action: 'family.deleteCancelled', targetType: 'parent', targetId: state.id, before: { deleteAfter: state.delete_after } });
    const { error } = await db().from('ig_parents').update({ delete_after: null, frozen_at: null }).eq('id', state.id);
    if (error) throw error;
    return reply.code(204).send();
  });

  /** Отложить удаление за неактивность: считаем, что семья была сегодня, предупреждение снимается. */
  app.post<{ Params: { id: string } }>('/families/:id/retention/postpone', { schema: { params: idParams } }, async (req, reply) => {
    const state = await stateOf(req.params.id);
    if (!state) return reply.code(404).send(missing);
    const lastSeenAt = new Date().toISOString();
    await audit(req, { action: 'family.retentionPostponed', targetType: 'parent', targetId: state.id, before: { lastSeenAt: state.last_seen_at, warnedAt: state.inactive_warned_at }, after: { lastSeenAt } });
    const { error } = await db().from('ig_parents').update({ last_seen_at: lastSeenAt, inactive_warned_at: null }).eq('id', state.id);
    if (error) throw error;
    return reply.code(204).send();
  });
};
