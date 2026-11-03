// Правило проекта: в одном файле кода не больше 200 строк. Длинный файл делим по смыслу на папку с index.ts.
// Проверяются .ts/.tsx/.js/.mjs/.cjs/.css/.sql в games, shell, platform, tools и visual-lab.
// Не проверяются: README и другие .md (документация может быть длинной), сборка, зависимости, результаты тестов.
// Запуск: corepack pnpm lint (вместе с проверкой границ).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_LINES = 200;
const root = fileURLToPath(new URL('..', import.meta.url));
const CODE = /\.(?:ts|tsx|js|jsx|mjs|cjs|css|sql)$/;
const SKIP = new Set(['node_modules', 'dist', 'dev-dist', 'build', 'coverage', 'test-results', 'playwright-report', '.tools']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const file = join(dir, name);
    if (statSync(file).isDirectory()) yield* walk(file);
    else if (CODE.test(name)) yield file;
  }
}

const tooLong = [];
for (const top of ['games', 'shell', 'platform', 'tools', 'visual-lab']) {
  const dir = join(root, top);
  if (!existsSync(dir)) continue;
  for (const file of walk(dir)) {
    const lines = readFileSync(file, 'utf8').replace(/\n$/, '').split('\n').length;
    if (lines > MAX_LINES) tooLong.push(`${relative(root, file)}  ${lines} строк`);
  }
}

if (tooLong.length) {
  console.error(`Файлы длиннее ${MAX_LINES} строк (${tooLong.length}) — разделите их по смыслу:\n  ${tooLong.join('\n  ')}`);
  process.exit(1);
}
console.log(`Размер файлов в порядке: везде не больше ${MAX_LINES} строк.`);
