export const env = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  databaseUrl: process.env.DATABASE_URL,
};
