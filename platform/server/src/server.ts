import { buildApp } from './app.js';
import { env } from './config/env.js';
import { mailEnabled } from './mail/mailer.js';

const app = await buildApp({ jobs: true });

// В проде без этих настроек сайт работает наполовину — говорим об этом громко при старте.
if (env.isProduction) {
  const missing = [
    !process.env.SUPABASE_URL && 'SUPABASE_URL',
    !process.env.SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
    !/^[0-9a-f]{64}$/i.test(env.sessionEncryptionKey ?? '') && 'SESSION_ENCRYPTION_KEY (64 hex)',
    !mailEnabled && 'MAIL_FROM_EMAIL + SMTP_USER/SMTP_PASSWORD или BREVO_API_KEY',
    !env.cookieSecure && 'COOKIE_SECURE=true',
    !process.env.APP_URL && 'APP_URL',
  ].filter(Boolean);
  if (missing.length) app.log.error({ missing }, 'Прод запущен без нужных настроек: вход, письма или cookie работать не будут');
  if (!env.cronSecret) app.log.warn('CRON_SECRET не задан: отчёт за неделю идёт только изнутри сервера и не уйдёт, пока сервер спит');
}

try {
  await app.listen({ host: env.host, port: env.port });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    app.close().then(() => process.exit(0));
  });
}
