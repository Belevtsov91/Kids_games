import type { GameApi } from '@ig/sdk';
import { waitForServer } from '@/wake/serverStatus';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/** Ошибка API: статус и текст для человека, если сервер его прислал. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Тело ответа с ошибкой: например { code, left } у входа в кабинет. */
    readonly data: Record<string, unknown> | null = null,
    /** Сколько секунд ждать по заголовку Retry-After (у 429); null — сервер не сказал. */
    readonly retryAfter: number | null = null,
  ) {
    super(message);
  }
}

/** Так отвечает прокси, когда сервер спит или упал: ответ не от нашего кода. */
const GATEWAY = new Set([502, 503, 504]);

/** Повторять после ожидания можно только то, что безопасно отправить дважды. POST мог уже выполниться. */
const IDEMPOTENT = new Set(['GET', 'HEAD', 'PUT', 'DELETE']);

/**
 * Ответ 5xx от прокси, а не от нашего сервера: наш сервер на ошибки всегда отвечает JSON с полем error
 * (например 503 «вход временно недоступен»). Такой ответ — это сервер не спит, а честно отказывает.
 */
async function fromGateway(res: Response): Promise<boolean> {
  if (!GATEWAY.has(res.status)) return false;
  const type = res.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) return true;
  const body = (await res.clone().json().catch(() => null)) as { error?: unknown } | null;
  return typeof body?.error !== 'string';
}

async function request<T>(url: string, init?: RequestInit, retry = IDEMPOTENT.has((init?.method ?? 'GET').toUpperCase())): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      // Единственная cookie — httpOnly-сессия от сервера; JS её не видит, браузер просто отправляет.
      credentials: 'same-origin',
      headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
    });
  } catch (err) {
    // Сервер не ответил вовсе: будим его (мишка поверх страницы) и повторяем безопасный запрос один раз.
    if (init?.signal?.aborted || !navigator.onLine) throw err;
    await waitForServer('lost');
    if (!retry) throw err;
    return request<T>(url, init, false);
  }
  if (await fromGateway(res)) {
    // Сервер спит: будим (мишка поверх страницы). Безопасный запрос повторяем, POST — нет: он мог уже пройти.
    await waitForServer('lost');
    if (retry) return request<T>(url, init, false);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ({ error?: string } & Record<string, unknown>) | null;
    const retryAfter = Number(res.headers.get('retry-after'));
    throw new ApiError(res.status, body?.error ?? `API ${res.status}: ${url}`, body, retryAfter > 0 ? Math.ceil(retryAfter) : null);
  }
  return (res.status === 204 ? undefined : res.json()) as Promise<T>;
}

/** Клиент с фиксированным префиксом: платформе — `/api`, игре — `/api/games/<id>`. */
export function createApiClient(prefix = ''): GameApi & {
  put<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
  delete(path: string, body?: unknown): Promise<void>;
} {
  const base = `${BASE_URL}${prefix}`;
  return {
    get: <T>(path: string) => request<T>(`${base}${path}`),
    post: <T>(path: string, body: unknown) => request<T>(`${base}${path}`, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(path: string, body: unknown) => request<T>(`${base}${path}`, { method: 'PUT', body: JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown) => request<T>(`${base}${path}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path: string, body?: unknown) =>
      request<void>(`${base}${path}`, body === undefined ? { method: 'DELETE' } : { method: 'DELETE', body: JSON.stringify(body) }),
  };
}

export const api = createApiClient();
