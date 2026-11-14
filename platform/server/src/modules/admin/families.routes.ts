import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db/index.js';
import { allRows, maskEmail, soft } from './data.js';
import { familyDetail } from './familyDetail.js';
import type { GameTable } from '../parent/index.js';

// Семьи: поиск одной строкой (почта, имя взрослого или ребёнка, id) и карточка семьи.
// Почта в ответах скрыта; целиком — отдельным запросом по клику.

const listQuery = {
  type: 'object',
  properties: {
    q: { type: 'string', maxLength: 100 },
    filter: { type: 'string', enum: ['all', 'frozen', 'deleting', 'pinLocked'] },
    page: { type: 'integer', minimum: 1, maximum: 10_000 },
  },
} as const;
export const idParams = { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } } as const;

const PAGE = 25;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Знаки, которые в фильтре PostgREST имеют свой смысл: из поисковой строки их убираем. */
const clean = (q: string) => q.replace(/[%_,()*\\]/g, ' ').trim();

interface ParentRow {
  id: string; email: string; display_name: string; created_at: string; last_seen_at: string | null;
  consent_at: string | null; frozen_at?: string | null; delete_after?: string | null;
}

const BASE = 'id, email, display_name, created_at, last_seen_at, consent_at';

export const familiesRoutes: FastifyPluginAsync<{ gameTables: GameTable[] }> = async (app, opts) => {
  app.get<{ Querystring: { q?: string; filter?: string; page?: number } }>('/families', { schema: { querystring: listQuery } }, async (req) => {
    const q = clean(req.query.q ?? '');
    const page = req.query.page ?? 1;
    const filter = req.query.filter ?? 'all';

    // Кого ищем: по почте и имени взрослого, по имени ребёнка, по id семьи или ребёнка.
    let ids: string[] | null = null;
    if (q) {
      const found = new Set<string>();
      if (UUID.test(q)) {
        found.add(q);
        const { data } = await db().from('ig_children').select('parent_id').eq('id', q).maybeSingle();
        if (data) found.add(data.parent_id);
      } else {
        const [byParent, byChild] = await Promise.all([
          allRows<{ id: string }>('ig_parents', 'id', (x) => x.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`).limit(200)),
          allRows<{ parent_id: string }>('ig_children', 'parent_id', (x) => x.ilike('name', `%${q}%`).limit(200)),
        ]);
        byParent.forEach((p) => found.add(p.id));
        byChild.forEach((c) => found.add(c.parent_id));
      }
      ids = [...found];
      if (!ids.length) return { total: 0, page, pageSize: PAGE, items: [] };
    }
    if (filter === 'pinLocked') {
      const locked = await allRows<{ parent_id: string }>('ig_parent_settings', 'parent_id', (x) => x.gt('pin_locked_until', new Date().toISOString()));
      const set = new Set(locked.map((l) => l.parent_id));
      ids = ids ? ids.filter((id) => set.has(id)) : [...set];
      if (!ids.length) return { total: 0, page, pageSize: PAGE, items: [] };
    }

    const build = (columns: string) => {
      let x = db().from('ig_parents').select(columns, { count: 'exact' });
      if (ids) x = x.in('id', ids);
      if (filter === 'frozen') x = x.not('frozen_at', 'is', null);
      if (filter === 'deleting') x = x.not('delete_after', 'is', null);
      return x.order('created_at', { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
    };
    // Колонок заморозки может ещё не быть (миграция 008): тогда список без них.
    let res = await build(`${BASE}, frozen_at, delete_after`);
    if (res.error) res = await build(BASE);
    if (res.error) throw res.error;
    const parents = (res.data ?? []) as unknown as ParentRow[];
    const pids = parents.map((p) => p.id);
    const none = ['00000000-0000-0000-0000-000000000000'];

    const [kids, settings] = await Promise.all([
      allRows<{ parent_id: string; deleted_at: string | null }>('ig_children', 'parent_id, deleted_at', (x) => x.in('parent_id', pids.length ? pids : none)),
      soft(() => allRows<{ parent_id: string; mail_locale: string | null; pin_locked_until: string | null }>('ig_parent_settings', 'parent_id, mail_locale, pin_locked_until', (x) => x.in('parent_id', pids.length ? pids : none)), []),
    ]);
    const setOf = new Map(settings.map((s) => [s.parent_id, s]));
    const now = Date.now();

    return {
      total: res.count ?? parents.length,
      page,
      pageSize: PAGE,
      items: parents.map((p) => {
        const s = setOf.get(p.id);
        return {
          id: p.id,
          name: p.display_name,
          email: maskEmail(p.email),
          children: kids.filter((k) => k.parent_id === p.id && !k.deleted_at).length,
          locale: s?.mail_locale ?? null,
          createdAt: p.created_at,
          lastSeenAt: p.last_seen_at,
          consent: Boolean(p.consent_at),
          frozen: Boolean(p.frozen_at),
          deleteAfter: p.delete_after ?? null,
          pinLocked: Boolean(s?.pin_locked_until && new Date(s.pin_locked_until).getTime() > now),
        };
      }),
    };
  });

  app.get<{ Params: { id: string }; Querystring: { tz?: string } }>('/families/:id', { schema: { params: idParams } }, async (req, reply) => {
    const detail = await familyDetail(req.params.id, opts.gameTables, req.query.tz);
    return detail ?? reply.code(404).send({ error: 'Семья не найдена' });
  });

  /** Почта целиком — по клику «Показать». */
  app.get<{ Params: { id: string } }>('/families/:id/email', { schema: { params: idParams } }, async (req, reply) => {
    const { data, error } = await db().from('ig_parents').select('email').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    return data ? { email: data.email } : reply.code(404).send({ error: 'Семья не найдена' });
  });
};
