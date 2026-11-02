// Серверная часть контракта игры. Без DOM и без зависимостей от Fastify:
// игры импортируют этот файл как `@ig/sdk/server`, сервер платформы — тоже.

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

/** preHandler: без входа (ни ребёнка, ни родителя) — 401. */
export async function requirePlayer(req: unknown, reply: ReplyLike) {
  if (!playerKeyOf(req)) return reply.code(401).send(NO_SESSION_ERROR);
}
