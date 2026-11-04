// Серверная часть контракта игры. Без DOM и без зависимостей от Fastify:
// игры импортируют этот файл как `@ig/sdk/server`, сервер платформы — тоже.

import type { SupabaseClient } from '@supabase/supabase-js';

/** Сессия, которую платформа кладёт в `req.session` для каждого запроса к /api. */
export interface PlayerSession {
  parentId: string;
  /** Какой ребёнок сейчас играет; null, пока профиль не выбран. */
  activeChildId: string | null;
}

/** Ответ, который отдаётся, когда ребёнок в сессии не выбран. */
export const NO_CHILD_ERROR = { error: 'Нужно выбрать ребёнка' } as const;
export const NO_SESSION_ERROR = { error: 'Нужно войти' } as const;

interface ReplyLike {
  code(status: number): { send(body: unknown): unknown };
}

/** Сессия запроса или null. Id игрока берём только отсюда — клиенту не доверяем. */
export function sessionOf(req: unknown): PlayerSession | null {
  const session = (req as { session?: Partial<PlayerSession> | null } | null)?.session;
  return session && typeof session === 'object' ? (session as PlayerSession) : null;
}

/** Id выбранного ребёнка из сессии или null. */
export function childIdOf(req: unknown): string | null {
  return sessionOf(req)?.activeChildId ?? null;
}

/**
 * Чей прогресс: выбранного ребёнка, а если ребёнок не выбран — родителя.
 * Возвращает ключ вида `child:<id>` / `parent:<id>` или null без входа.
 */
export function playerKeyOf(req: unknown): string | null {
  const session = sessionOf(req);
  if (session?.activeChildId) return `child:${session.activeChildId}`;
  if (session?.parentId) return `parent:${session.parentId}`;
  return null;
}

/**
 * preHandler для маршрутов игры: без выбранного ребёнка — 401.
 * После него в обработчике можно смело писать `childIdOf(req)!`.
 */
export async function requireChild(req: unknown, reply: ReplyLike) {
  if (!childIdOf(req)) return reply.code(401).send(NO_CHILD_ERROR);
}

/**
 * Может ли взрослый сейчас смотреть данные этого ребёнка: он вошёл, кабинет открыт (задача и PIN)
 * и ребёнок его. Так игра показывает родителю, например, рисунки любого своего ребёнка.
 * Проверяет платформа: игра только спрашивает.
 */
export async function parentCanView(req: unknown, childId: string): Promise<boolean> {
  const check = (req as { canParentView?: ((childId: string) => Promise<boolean>) | null } | null)?.canParentView;
  return typeof check === 'function' ? check(childId) : false;
}

/** preHandler: без входа (ни ребёнка, ни родителя) — 401. */
export async function requirePlayer(req: unknown, reply: ReplyLike) {
  if (!playerKeyOf(req)) return reply.code(401).send(NO_SESSION_ERROR);
}

// ── База данных игры ──────────────────────────────────────────────────────────
// Платформа передаёт серверу игры клиент БД в опциях плагина: `{ db }`.
// Клиент пускает только в таблицы этой игры: `ig_game_<id>_*` (дефисы в id → `_`).
// Чужие таблицы — платформы или другой игры — недоступны: `from()` бросает ошибку.


/** Клиент БД игры: только `from(<своя таблица>)`. */
export type GameDb = Pick<SupabaseClient, 'from'>;

/** Опции, с которыми платформа подключает `server/index.ts` игры. */
export interface GameServerOptions {
  /** null — БД не настроена (тесты, локальный запуск без Supabase): игра держит данные в памяти. */
  db?: GameDb | null;
}

/** Префикс таблиц игры: `who-lives-where` → `ig_game_who_lives_where_`. */
export function gameTablePrefix(gameId: string): string {
  return `ig_game_${gameId.replace(/-/g, '_')}_`;
}

/** Оборачивает клиент так, что игра видит только свои таблицы. */
export function scopeGameDb(client: GameDb, gameId: string): GameDb {
  const prefix = gameTablePrefix(gameId);
  return {
    from(table: string) {
      if (!table.startsWith(prefix)) {
        throw new Error(`Игре ${gameId} доступны только таблицы ${prefix}*, а не ${table}`);
      }
      return client.from(table);
    },
  } as GameDb;
}
