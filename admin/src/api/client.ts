// Запросы к /api/admin. Cookie сессии ставит сервер (httpOnly), здесь её не видно и не нужно.

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
  ) {
    super(message);
  }
}

/** Часовой пояс владельца: по нему считаются «сегодня» и дни на графиках. */
export const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

let onUnauthorized: () => void = () => undefined;
/** Сессия кончилась (8 часов) или её закрыли: показать вход. */
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn);

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown; raw?: boolean } = {}): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    method: init.method ?? 'GET',
    credentials: 'same-origin',
    headers: init.body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  if (init.raw && res.ok) return (await res.blob()) as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const code = data?.code as string | undefined;
    if (res.status === 401 && code === 'auth') onUnauthorized();
    throw new ApiError(res.status, code, data?.error ?? `HTTP ${res.status}`);
  }
  return data as T;
}

export const get = <T>(path: string) => api<T>(path);
export const post = <T = void>(path: string, body: unknown = {}) => api<T>(path, { method: 'POST', body });
export const put = <T = void>(path: string, body: unknown) => api<T>(path, { method: 'PUT', body });
export const patch = <T = void>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body });
export const del = <T = void>(path: string) => api<T>(path, { method: 'DELETE' });

/** Скачать файл, который отдаёт сервер (выгрузка семьи, CSV журнала). */
export async function download(path: string, filename: string) {
  const blob = await api<Blob>(path, { raw: true });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export const qs = (params: Record<string, string | number | undefined>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') s.set(k, String(v));
  const text = s.toString();
  return text ? `?${text}` : '';
};
