import type { FastifyPluginAsync } from 'fastify';
import { INACTIVE_DAYS, TRASH_DAYS, WARN_DAYS } from '../children/profileRules.js';
import { allRows, maskEmail, soft } from './data.js';

// Хранение и удаление: кто скоро удалится за неактивность, аккаунты на удалении (7 дней на отмену), корзина профилей.

const DAY = 86_400_000;

export const retentionAdminRoutes: FastifyPluginAsync = async (app) => {
  app.get('/retention', async () => {
    const now = Date.now();
    const idleSince = new Date(now - (INACTIVE_DAYS - WARN_DAYS) * DAY).toISOString();
    const [inactive, deleting, trash] = await Promise.all([
      allRows<{ id: string; email: string; display_name: string; last_seen_at: string; inactive_warned_at: string | null }>(
        'ig_parents', 'id, email, display_name, last_seen_at, inactive_warned_at', (q) => q.lt('last_seen_at', idleSince).order('last_seen_at').limit(500)),
      soft(() => allRows<{ id: string; email: string; display_name: string; delete_after: string }>(
        'ig_parents', 'id, email, display_name, delete_after', (q) => q.not('delete_after', 'is', null).order('delete_after')), []),
      allRows<{ id: string; parent_id: string; name: string; age: number; avatar: string; deleted_at: string }>(
        'ig_children', 'id, parent_id, name, age, avatar, deleted_at', (q) => q.not('deleted_at', 'is', null).order('deleted_at')),
    ]);
    return {
      rules: { inactiveDays: INACTIVE_DAYS, warnDays: WARN_DAYS, trashDays: TRASH_DAYS },
      inactive: inactive.map((p) => ({
        id: p.id,
        name: p.display_name,
        email: maskEmail(p.email),
        idleDays: Math.floor((now - new Date(p.last_seen_at).getTime()) / DAY),
        warnedAt: p.inactive_warned_at,
        // Без письма-предупреждения аккаунт не удаляется: срок считается от него.
        deleteAt: p.inactive_warned_at ? new Date(new Date(p.inactive_warned_at).getTime() + WARN_DAYS * DAY).toISOString() : null,
      })),
      deleting: deleting.map((p) => ({ id: p.id, name: p.display_name, email: maskEmail(p.email), deleteAfter: p.delete_after })),
      trash: trash.map((c) => ({ id: c.id, parentId: c.parent_id, name: c.name, age: c.age, avatar: c.avatar, deletedAt: c.deleted_at, purgeAt: new Date(new Date(c.deleted_at).getTime() + TRASH_DAYS * DAY).toISOString() })),
    };
  });
};
