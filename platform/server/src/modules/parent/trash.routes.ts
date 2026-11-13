import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { MAX_CHILDREN } from '../children/children.routes.js';
import { TRASH_DAYS } from '../children/profileRules.js';
import { childCount } from '../children/switchGuard.js';
import { ownsChild, requireParent } from './parentSession.js';

// Корзина профилей: удалённый профиль лежит TRASH_DAYS дней, его можно вернуть или стереть сразу.
// Раньше удаление стирало всё каскадом в ту же секунду, и ошибку было не исправить.

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
} as const;

export const trashRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireParent);

  app.get('/trash', async (req) => {
    const { data, error } = await db()
      .from('ig_children')
      .select('id, name, avatar, deleted_at')
      .eq('parent_id', req.session!.parentId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      deletedAt: c.deleted_at,
      purgeAt: new Date(new Date(c.deleted_at).getTime() + TRASH_DAYS * 86_400_000).toISOString(),
    }));
  });

  /** Вернуть профиль из корзины со всеми сохранениями. */
  app.post<{ Params: { id: string } }>('/trash/:id/restore', { schema: { params: idParams } }, async (req, reply) => {
    const parentId = req.session!.parentId;
    if (!(await ownsChild(parentId, req.params.id, true))) return reply.code(404).send({ error: 'Профиль не найден' });
    if ((await childCount(parentId)) >= MAX_CHILDREN) return reply.code(409).send({ error: `Не больше ${MAX_CHILDREN} профилей` });
    const { error } = await db().from('ig_children').update({ deleted_at: null }).eq('id', req.params.id);
    if (error) throw error;
    return reply.code(204).send();
  });

  /** Стереть сразу, не дожидаясь чистки: сохранения всех игр, рисунки и время удаляются каскадом. */
  app.delete<{ Params: { id: string } }>('/trash/:id', { schema: { params: idParams } }, async (req, reply) => {
    if (!(await ownsChild(req.session!.parentId, req.params.id, true))) return reply.code(404).send({ error: 'Профиль не найден' });
    const { error } = await db().from('ig_children').delete().eq('id', req.params.id);
    if (error) throw error;
    return reply.code(204).send();
  });
};
