import { fileURLToPath } from 'node:url';

export function parseTrustProxy(value: string | undefined): boolean | number {
  if (value === undefined || value === '') return process.env.NODE_ENV === 'production' ? 2 : false;
  if (value === 'true') return true;
  if (value === 'false') return false;
  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : false;
}

const list = (value: string | undefined) => (value ?? '').split(',').map((v) => v.trim()).filter(Boolean);

export const env = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? 3000),
  /** Первый адрес из CORS_ORIGIN — основной (ссылки в письмах, если нет APP_URL). */
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',')[0].trim(),
  /** Все разрешённые адреса сайта через запятую: прод, www, превью Vercel. */
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean),
  /**
   * Сколько прокси перед сервером (Vercel → Render = 2) или true — доверять X-Forwarded-For целиком.
   * Без этого все посетители видны серверу с одного адреса прокси и делят один rate-limit.
   */
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  /** Секрет для фоновых задач по расписанию (POST /api/jobs/*, заголовок x-cron-secret). */
  cronSecret: process.env.CRON_SECRET,
  logLevel: process.env.LOG_LEVEL ?? 'info',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  /** 32 байта в hex: шифрует cookie сессии. */
  sessionEncryptionKey: process.env.SESSION_ENCRYPTION_KEY,
  /** true за HTTPS (прод). Локально по http — false, иначе браузер не сохранит cookie. */
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  /** Адрес сайта для ссылок в письмах (например, https://interact-games.vercel.app). По умолчанию CORS_ORIGIN. */
  appUrl: (process.env.APP_URL ?? (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',')[0].trim()).replace(/\/+$/, ''),
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
  /**
   * Админка владельца (/api/admin). Пусто ADMIN_EMAILS — маршрутов нет вообще, сайт работает как раньше.
   * ADMIN_ORIGIN — адрес сайта админки (несколько через запятую): изменяющие запросы к /api/admin только оттуда.
   * ADMIN_SETUP_TOKEN — разовый секрет первой настройки (пароль + код из приложения); после настройки его можно убрать.
   */
  admin: {
    emails: list(process.env.ADMIN_EMAILS).map((e) => e.toLowerCase()),
    origins: list(process.env.ADMIN_ORIGIN).map((o) => o.replace(/\/+$/, '')),
    setupToken: process.env.ADMIN_SETUP_TOKEN,
    /** Тревоги и утренняя сводка в Telegram: токен бота и id чата. Без них тревоги только в админке. */
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChat: process.env.TELEGRAM_CHAT_ID,
  },
  isProduction: process.env.NODE_ENV === 'production',
  /** Папка с играми; по умолчанию games/ в корне репозитория. */
  gamesDir: process.env.GAMES_DIR ?? fileURLToPath(new URL('../../../../games', import.meta.url)),
};
