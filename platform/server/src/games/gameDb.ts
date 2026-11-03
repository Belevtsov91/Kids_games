import { scopeGameDb, type GameDb } from '@ig/sdk/server';
import { supabase } from '../db/index.js';

/**
 * Клиент БД для сервера игры: только таблицы `ig_game_<id>_*`.
 * Таблицы платформы (ig_parents, ig_children, ig_sessions) и других игр игре недоступны.
 * null — БД не настроена: игра хранит данные в памяти.
 */
export function gameDb(gameId: string): GameDb | null {
  return supabase ? scopeGameDb(supabase, gameId) : null;
}
