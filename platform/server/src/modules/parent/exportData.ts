import { db } from '../../db/index.js';
import type { GameTable } from './index.js';

// Все данные семьи на платформе одним объектом: для выгрузки из кабинета родителя и из админки владельца.
// Хеши пароля, PIN и токенов не отдаём.

/** null — запрошен ребёнок, которого у семьи нет. */
export async function exportFamily(parentId: string, gameTables: GameTable[], childId?: string) {
  const one = async (table: string, columns: string, key: string, value: string | string[]) => {
    const q = db().from(table).select(columns);
    const { data, error } = Array.isArray(value) ? await q.in(key, value.length ? value : ['00000000-0000-0000-0000-000000000000']) : await q.eq(key, value);
    if (error) throw error;
    return data ?? [];
  };
  const parent = await one('ig_parents', 'id, email, display_name, created_at, consent_at, policy_version, last_seen_at', 'id', parentId);
  // childId — только один ребёнок (например, перед удалением профиля). Профили из корзины тоже выгружаются.
  const all = (await one('ig_children', 'id, name, age, avatar, created_at, deleted_at', 'parent_id', parentId)) as unknown as { id: string }[];
  const children = childId ? all.filter((c) => c.id === childId) : all;
  if (childId && !children.length) return null;
  const ids = children.map((c) => c.id);
  return {
    exportedAt: new Date().toISOString(),
    parent: parent[0] ?? null,
    parentSettings: (await one('ig_parent_settings', 'photo, timezone, weekly_report, notify_requests, mail_locale, onboarded', 'parent_id', parentId))[0] ?? null,
    helpers: await one('ig_helpers', 'name, email, child_ids, created_at, last_used_at', 'parent_id', parentId),
    children,
    childSettings: await one('ig_child_settings', '*', 'child_id', ids),
    gameAccess: await one('ig_child_game_access', '*', 'child_id', ids),
    playDaily: await one('ig_play_daily', '*', 'child_id', ids),
    timeRequests: await one('ig_time_requests', '*', 'child_id', ids),
    playEvents: await one('ig_play_events', 'child_id, game_id, kind, name, ok, created_at', 'child_id', ids),
    stickers: await one('ig_stickers', '*', 'child_id', ids),
    cloudSaves: await one('ig_cloud_saves', '*', 'child_id', ids),
    // Данные игр со своим сервером: рисунки, мелодии, острова, сохранения. У каждой таблицы есть child_id.
    games: Object.fromEntries(
      await Promise.all(gameTables.map(async ({ gameId, table }) => [`${gameId}/${table}`, await one(table, '*', 'child_id', ids)] as const)),
    ),
  };
}
