import { ApiError } from '@/api/client';
import type { Dict } from '@/i18n/dict';

/** Ошибку сервера показываем на языке сайта по коду ответа: текст сервера всегда русский. */
export function serverMessage(err: unknown, a: Dict['auth']): string {
  if (!(err instanceof ApiError)) return a.offline;
  switch (err.status) {
    case 400: return a.checkFields;
    case 401: return a.wrongLogin;
    case 409: return a.emailTaken;
    case 429: return a.tooMany;
    case 503: return a.unavailable;
    // Сервер ответил, значит сеть есть: «нет сети» тут только путает.
    default: return a.serverError;
  }
}

export const statusOf = (err: unknown) => (err instanceof ApiError ? err.status : 0);
