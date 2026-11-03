// Собирает все миграции в один SQL-скрипт для Supabase SQL Editor:
// сначала платформа (platform/server/migrations), потом каждая игра (games/<id>/server/migrations).
// Все миграции идемпотентны (create … if not exists), повторный запуск безопасен.
// Запуск: corepack pnpm db:sql > all.sql
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const sqlFiles = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.sql')).sort().map((n) => join(dir, n)) : [];

const games = existsSync(join(root, 'games')) ? readdirSync(join(root, 'games')).sort() : [];
const files = [
  ...sqlFiles(join(root, 'platform', 'server', 'migrations')),
  ...games.flatMap((id) => sqlFiles(join(root, 'games', id, 'server', 'migrations'))),
];

for (const file of files) {
  process.stdout.write(`-- ===== ${relative(root, file).replaceAll('\\', '/')} =====\n${readFileSync(file, 'utf8').trimEnd()}\n\n`);
}
