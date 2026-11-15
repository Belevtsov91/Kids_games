import type { Locale } from '@/i18n/locale';

// Флаги сайта из админки владельца: режим обслуживания, объявление, выключенные игры.
// Сервер отдаёт их без входа: GET /api/site (platform/server/src/modules/admin/public.routes.ts).

export interface SiteFlags {
  maintenance: boolean;
  /** Объявление на языках сайта; пустой объект — объявления нет. */
  banner: Partial<Record<Locale, string>>;
  disabledGames: string[];
}

export const NO_FLAGS: SiteFlags = { maintenance: false, banner: {}, disabledGames: [] };

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/** Разбирает ответ сервера; всё непонятное — «как обычно», чтобы кривой ответ не закрыл сайт. */
export function parseFlags(raw: unknown): SiteFlags {
  if (!raw || typeof raw !== 'object') return NO_FLAGS;
  const r = raw as Record<string, unknown>;
  const banner: SiteFlags['banner'] = {};
  if (r.banner && typeof r.banner === 'object') {
    for (const [key, value] of Object.entries(r.banner as Record<string, unknown>)) {
      if ((key === 'ru' || key === 'uk' || key === 'ro' || key === 'en') && typeof value === 'string' && value.trim()) banner[key] = value.trim();
    }
  }
  return {
    maintenance: r.maintenance === true,
    banner,
    disabledGames: Array.isArray(r.disabledGames) ? r.disabledGames.filter((id): id is string => typeof id === 'string') : [],
  };
}

/** Текст объявления на языке сайта, иначе на любом из заполненных. */
export function bannerText(banner: SiteFlags['banner'], locale: Locale): string | null {
  return banner[locale] ?? banner.ru ?? banner.en ?? banner.uk ?? banner.ro ?? null;
}

/**
 * Без клиента API: тот будит спящий сервер мишкой, а флаги — фоновый запрос.
 * Ошибка сети или старый сервер без /api/site — null: оставляем то, что было.
 */
export async function fetchFlags(signal?: AbortSignal): Promise<SiteFlags | null> {
  try {
    const res = await fetch(`${BASE_URL}/site`, { credentials: 'same-origin', signal });
    if (!res.ok) return null;
    return parseFlags(await res.json());
  } catch {
    return null;
  }
}
