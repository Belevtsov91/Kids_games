import type { GameApi } from '@ig/sdk';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/** Ошибка API: статус и текст для человека, если сервер его прислал. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    // Единственная cookie — httpOnly-сессия от сервера; JS её не видит, браузер просто отправляет.
    credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(res.status, body?.error ?? `API ${res.status}: ${url}`);
  }
  return (res.status === 204 ? undefined : res.json()) as Promise<T>;
}

/** Клиент с фиксированным префиксом: платформе — `/api`, игре — `/api/games/<id>`. */
export function createApiClient(prefix = ''): GameApi & { put<T>(path: string, body: unknown): Promise<T> } {
  const base = `${BASE_URL}${prefix}`;
  return {
    get: <T>(path: string) => request<T>(`${base}${path}`),
    post: <T>(path: string, body: unknown) => request<T>(`${base}${path}`, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(path: string, body: unknown) => request<T>(`${base}${path}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (path: string) => request<void>(`${base}${path}`, { method: 'DELETE' }),
  };
}

export const api = createApiClient();
