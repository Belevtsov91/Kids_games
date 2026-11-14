import { db } from '../../db/index.js';
import { effectiveAge } from '../children/childView.js';
import { TRASH_DAYS } from '../children/profileRules.js';
import { summarizeSkills, type SkillEvent } from '../progress/skills.js';
import type { GameTable } from '../parent/index.js';
import { allRows, countRows, dayIn, daysBack, maskEmail, soft } from './data.js';

// Карточка семьи для админки: взрослый, настройки, помощники, дети с настройками, временем и сохранениями.
// Фото, рисунки и содержимое сохранений сюда не попадают: только «есть ли», размер и дата.

const NONE = ['00000000-0000-0000-0000-000000000000'];

interface Child { id: string; name: string; age: number; avatar: string; created_at: string; deleted_at: string | null }
type Row = Record<string, unknown>;

async function parentRow(id: string) {
  const base = 'id, email, display_name, created_at, last_seen_at, consent_at, policy_version, inactive_warned_at';
  const full = await db().from('ig_parents').select(`${base}, frozen_at, delete_after`).eq('id', id).maybeSingle();
  if (!full.error) return full.data as Row | null;
  const { data, error } = await db().from('ig_parents').select(base).eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Row | null;
}

/** Сохранения ребёнка: облако платформы по играм и строки в таблицах игр со своим сервером. Только размер и дата. */
async function savesOf(childId: string, gameTables: GameTable[]) {
  const cloud = await allRows<{ game_id: string; key: string; value: unknown; updated_at: string }>('ig_cloud_saves', 'game_id, key, value, updated_at', (q) => q.eq('child_id', childId));
  const byGame = new Map<string, { gameId: string; kind: 'cloud'; items: number; bytes: number; updatedAt: string }>();
  for (const row of cloud) {
    const cur = byGame.get(row.game_id) ?? { gameId: row.game_id, kind: 'cloud' as const, items: 0, bytes: 0, updatedAt: row.updated_at };
    cur.items += 1;
    cur.bytes += Buffer.byteLength(JSON.stringify(row.value));
    if (row.updated_at > cur.updatedAt) cur.updatedAt = row.updated_at;
    byGame.set(row.game_id, cur);
  }
  const tables = await Promise.all(
    gameTables.map(async ({ gameId, table }) => ({ gameId, kind: 'table' as const, table, items: await soft(() => countRows(table, (q) => q.eq('child_id', childId)), 0) })),
  );
  return [...byGame.values(), ...tables.filter((t) => t.items > 0)];
}

export async function familyDetail(parentId: string, gameTables: GameTable[], tz?: string) {
  const parent = await parentRow(parentId);
  if (!parent) return null;
  const now = new Date();
  const week = daysBack(dayIn(tz, now), 7);
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000).toISOString();

  const [settingsRes, helpers, sessions, children] = await Promise.all([
    db().from('ig_parent_settings').select('timezone, mail_locale, weekly_report, notify_requests, onboarded, pin_hash, pin_locked_until, photo').eq('parent_id', parentId).maybeSingle(),
    allRows<Row>('ig_helpers', 'id, name, email, child_ids, created_at, last_used_at', (q) => q.eq('parent_id', parentId)),
    countRows('ig_sessions', (q) => q.eq('parent_id', parentId).gt('expires_at', now.toISOString())),
    allRows<Child>('ig_children', 'id, name, age, avatar, created_at, deleted_at', (q) => q.eq('parent_id', parentId).order('created_at')),
  ]);
  if (settingsRes.error) throw settingsRes.error;
  const s = settingsRes.data;
  const ids = children.length ? children.map((c) => c.id) : NONE;

  const [extras, plays, access, requests, stickers, events] = await Promise.all([
    allRows<Row>('ig_child_settings', '*', (q) => q.in('child_id', ids)),
    allRows<{ child_id: string; day: string; game_id: string; seconds: number }>('ig_play_daily', 'child_id, day, game_id, seconds', (q) => q.in('child_id', ids).gte('day', week[0])),
    allRows<{ child_id: string; game_id: string; allowed: boolean }>('ig_child_game_access', 'child_id, game_id, allowed', (q) => q.in('child_id', ids)),
    allRows<Row>('ig_time_requests', 'child_id, minutes, status, from_parent, created_at', (q) => q.in('child_id', ids).gte('created_at', monthAgo).order('created_at', { ascending: false }).limit(50)),
    allRows<{ child_id: string }>('ig_stickers', 'child_id', (q) => q.in('child_id', ids)),
    allRows<SkillEvent & { child_id: string }>('ig_play_events', 'child_id, game_id, kind, name, ok, created_at', (q) => q.in('child_id', ids).gte('created_at', monthAgo)),
  ]);

  return {
    parent: {
      id: parent.id,
      name: parent.display_name,
      email: maskEmail(String(parent.email)),
      createdAt: parent.created_at,
      lastSeenAt: parent.last_seen_at,
      consentAt: parent.consent_at,
      policyVersion: parent.policy_version,
      inactiveWarnedAt: parent.inactive_warned_at,
      frozenAt: parent.frozen_at ?? null,
      deleteAfter: parent.delete_after ?? null,
    },
    settings: {
      timezone: s?.timezone ?? null,
      mailLocale: s?.mail_locale ?? null,
      weeklyReport: s?.weekly_report ?? false,
      notifyRequests: s?.notify_requests ?? true,
      onboarded: s?.onboarded ?? false,
      hasPin: Boolean(s?.pin_hash),
      pinLockedUntil: s?.pin_locked_until && new Date(s.pin_locked_until) > now ? s.pin_locked_until : null,
      hasPhoto: Boolean(s?.photo),
    },
    sessions,
    helpers,
    requests,
    children: await Promise.all(
      children.map(async (c) => {
        const { photo, child_id: _id, ...extra } = (extras.find((e) => e.child_id === c.id) ?? {}) as Row;
        const mine = plays.filter((p) => p.child_id === c.id);
        return {
          id: c.id,
          name: c.name,
          age: effectiveAge(c.age, extra.birth_month as string | null | undefined),
          avatar: c.avatar,
          createdAt: c.created_at,
          deletedAt: c.deleted_at,
          purgeAt: c.deleted_at ? new Date(new Date(c.deleted_at).getTime() + TRASH_DAYS * 86_400_000).toISOString() : null,
          hasPhoto: Boolean(photo),
          settings: extra,
          access: access.filter((a) => a.child_id === c.id).map(({ game_id, allowed }) => ({ gameId: game_id, allowed })),
          week: week.map((day) => ({
            day,
            games: mine.filter((p) => p.day === day).map((p) => ({ gameId: p.game_id, minutes: Math.round(p.seconds / 60) })),
          })),
          stickers: stickers.filter((x) => x.child_id === c.id).length,
          skills: summarizeSkills(events.filter((e) => e.child_id === c.id)),
          saves: await savesOf(c.id, gameTables),
        };
      }),
    ),
  };
}
