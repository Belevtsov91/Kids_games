import type { FastifyRequest } from 'fastify';
import { db } from '../../db/index.js';

// Журнал действий владельца: каждое изменение и каждый просмотр фото или рисунка ребёнка.
// Запись в журнал обязательна: если она не удалась, действие считается неудавшимся (ошибка уходит наверх).

export interface AuditEntry {
  action: string;
  targetType?: 'parent' | 'child' | 'game' | 'site' | 'mail' | 'job' | 'admin' | 'error' | 'news';
  targetId?: string;
  before?: unknown;
  after?: unknown;
}

export async function audit(req: FastifyRequest, entry: AuditEntry) {
  const { error } = await db().from('ig_admin_audit').insert({
    admin_email: req.admin?.email ?? 'unknown',
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    before: entry.before ?? null,
    after: entry.after ?? null,
    ip: req.ip.slice(0, 64),
  });
  if (error) throw error;
}
