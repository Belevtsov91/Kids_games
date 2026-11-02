import { fileURLToPath } from 'node:url';

export const env = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  /** 32 байта в hex: шифрует cookie сессии. */
  sessionEncryptionKey: process.env.SESSION_ENCRYPTION_KEY,
  /** true за HTTPS (прод). Локально по http — false, иначе браузер не сохранит cookie. */
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  /** Папка с играми; по умолчанию games/ в корне репозитория. */
  gamesDir: process.env.GAMES_DIR ?? fileURLToPath(new URL('../../../../games', import.meta.url)),
};
