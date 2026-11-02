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

