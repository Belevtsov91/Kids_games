import { db } from '../../db/index.js';

// Флаги сайта (ig_site_flags): режим обслуживания, объявление, выключенные игры, «только чтение» админки.
// Читаются часто (каждый запрос каталога), поэтому держим в памяти полминуты.

export interface SiteFlags {
  maintenance: boolean;
  /** Объявление для родителей на четырёх языках; пустой объект — нет объявления. */
  banner: Partial<Record<'ru' | 'uk' | 'ro' | 'en', string>>;
  disabled_games: string[];
  admin_readonly: boolean;
}

export const DEFAULT_FLAGS: SiteFlags = { maintenance: false, banner: {}, disabled_games: [], admin_readonly: false };

const TTL_MS = 30_000;
let cache: { at: number; flags: SiteFlags } | null = null;

/** Таблицы может ещё не быть (миграция 008 не накатана): тогда флаги по умолчанию, сайт работает как раньше. */
export async function siteFlags(fresh = false): Promise<SiteFlags> {
  if (!fresh && cache && Date.now() - cache.at < TTL_MS) return cache.flags;
  try {
    const { data, error } = await db().from('ig_site_flags').select('key, value');
    if (error) throw error;
    const flags = { ...DEFAULT_FLAGS } as Record<string, unknown>;
    for (const row of data ?? []) if (row.key in DEFAULT_FLAGS) flags[row.key] = row.value;
    cache = { at: Date.now(), flags: flags as unknown as SiteFlags };
  } catch {
    cache = { at: Date.now(), flags: cache?.flags ?? DEFAULT_FLAGS };
  }
  return cache.flags;
}

export async function setFlag<K extends keyof SiteFlags>(key: K, value: SiteFlags[K]) {
  const { error } = await db().from('ig_site_flags').upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
  cache = null;
}
