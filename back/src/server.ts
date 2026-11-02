import { buildApp } from './app.js';
import { env } from './config/env.js';

const app = await buildApp();

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
