// Подключение к БД: Supabase через supabase-js (HTTPS, работает по IPv4).
// Таблицы платформы (ig_*): migrations/*.sql. Браузер в Supabase не ходит — только этот сервер.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

/** Серверный клиент с секретным ключом (обходит RLS) — только на бэкенде. null, если переменные не заданы. */
export const supabase: SupabaseClient | null =
  env.supabaseUrl && env.supabaseServiceRoleKey
    ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

/**
 * Клиент БД для кода, который работает только при настроенной БД (за входом / сессией).
 * Если БД всё же не настроена — понятная ошибка в логе вместо падения на `null`.
 */
export function db(): SupabaseClient {
  if (!supabase) throw new Error('БД не настроена: задайте SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY');
  return supabase;
}
