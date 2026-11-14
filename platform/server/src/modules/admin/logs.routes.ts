import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { db } from '../../db/index.js';
import { audit } from './audit.js';
import { maskEmail, soft } from './data.js';

// Журналы: мои действия, письма, ошибки, неудачные входы родителей, запуски задач.
// Каждый журнал листается страницами и выгружается в CSV (?format=csv — до 5000 последних строк).

const listQuery = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, maximum: 100_000 },
    format: { type: 'string', enum: ['json', 'csv'] },
    q: { type: 'string', maxLength: 80 },
  },
} as const;
type Q = { Querystring: { page?: number; format?: 'json' | 'csv'; q?: string } };

const PAGE = 50;
const CSV_MAX = 5000;

const cell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  // Формулы в Excel начинаются с = + - @: экранируем, чтобы файл нельзя было превратить в исполняемый.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
};

export const toCsv = (rows: Record<string, unknown>[], columns: string[]) =>
  `﻿${[columns.join(';'), ...rows.map((r) => columns.map((c) => cell(r[c])).join(';'))].join('\r\n')}`;

interface Journal {
  path: string;
  table: string;
  columns: string[];
  order: string;
  /** Колонка для поиска по подстроке. */
  search?: string;
  /** Колонка с почтой: в ответе скрывается. */
  mask?: string;
}

const JOURNALS: Journal[] = [
  { path: '/audit', table: 'ig_admin_audit', columns: ['created_at', 'admin_email', 'action', 'target_type', 'target_id', 'before', 'after', 'ip'], order: 'created_at', search: 'action' },
  { path: '/mail', table: 'ig_mail_log', columns: ['id', 'created_at', 'to_email', 'tag', 'subject', 'ok', 'error'], order: 'created_at', search: 'to_email', mask: 'to_email' },
  { path: '/errors', table: 'ig_error_log', columns: ['fingerprint', 'source', 'path', 'message', 'count', 'first_at', 'last_at', 'resolved_at'], order: 'last_at', search: 'message' },
  { path: '/login-failures', table: 'ig_login_failures', columns: ['created_at', 'email', 'known', 'ip'], order: 'created_at', search: 'email', mask: 'email' },
  { path: '/job-runs', table: 'ig_job_runs', columns: ['started_at', 'job', 'ok', 'note', 'manual'], order: 'started_at', search: 'job' },
];

async function send(reply: FastifyReply, j: Journal, query: Q['Querystring']) {
  const csv = query.format === 'csv';
  const page = query.page ?? 1;
  const q = (query.q ?? '').replace(/[%_,()*\\]/g, ' ').trim();
  const result = await soft(async () => {
    let x = db().from(j.table).select(j.columns.join(', '), { count: 'exact' }).order(j.order, { ascending: false });
    if (q && j.search) x = x.ilike(j.search, `%${q}%`);
    const { data, error, count } = csv ? await x.limit(CSV_MAX) : await x.range((page - 1) * PAGE, page * PAGE - 1);
    if (error) throw error;
    return { rows: (data ?? []) as unknown as Record<string, unknown>[], total: count ?? 0 };
  }, { rows: [], total: 0 });
  const rows = j.mask ? result.rows.map((r) => ({ ...r, [j.mask!]: maskEmail(String(r[j.mask!])) })) : result.rows;
  if (!csv) return { total: result.total, page, pageSize: PAGE, items: rows };
  return reply
    .header('Content-Disposition', `attachment; filename="${j.table}-${new Date().toISOString().slice(0, 10)}.csv"`)
    .type('text/csv; charset=utf-8')
    .send(toCsv(rows, j.columns));
}

export const logsRoutes: FastifyPluginAsync = async (app) => {
  for (const journal of JOURNALS) {
    app.get<Q>(journal.path, { schema: { querystring: listQuery } }, async (req, reply) => send(reply, journal, req.query));
  }

  /** Пометить ошибку разобранной: она уходит из счётчика, пока не повторится. */
  app.post<{ Params: { fingerprint: string } }>(
    '/errors/:fingerprint/resolve',
    { schema: { params: { type: 'object', required: ['fingerprint'], properties: { fingerprint: { type: 'string', pattern: '^[0-9a-f]{64}$' } } } } },
    async (req, reply) => {
      await audit(req, { action: 'error.resolved', targetType: 'error', targetId: req.params.fingerprint.slice(0, 16) });
      const { error } = await db().from('ig_error_log').update({ resolved_at: new Date().toISOString() }).eq('fingerprint', req.params.fingerprint);
      if (error) throw error;
      return reply.code(204).send();
    },
  );
};
