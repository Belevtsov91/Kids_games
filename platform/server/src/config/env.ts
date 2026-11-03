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
  /** Адрес сайта для ссылок в письмах (например, https://interact-games.vercel.app). По умолчанию CORS_ORIGIN. */
  appUrl: (process.env.APP_URL ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173').replace(/\/+$/, ''),
  /** Почта через Brevo: SMTP-ключ (smtp-relay.brevo.com) или ключ HTTP API. Без них письма не уходят. */
  mail: {
    smtpHost: process.env.SMTP_HOST ?? 'smtp-relay.brevo.com',
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    brevoApiKey: process.env.BREVO_API_KEY,
    fromEmail: process.env.MAIL_FROM_EMAIL ?? process.env.SMTP_FROM_EMAIL,
    fromName: process.env.MAIL_FROM_NAME ?? 'Interact Games',
  },
  isProduction: process.env.NODE_ENV === 'production',
  /** Папка с играми; по умолчанию games/ в корне репозитория. */
  gamesDir: process.env.GAMES_DIR ?? fileURLToPath(new URL('../../../../games', import.meta.url)),
};
