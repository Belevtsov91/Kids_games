// Линтер границ: игры не импортируют друг друга, оболочку и сервер платформы;
// платформа и оболочка не импортируют код игр (оболочка видит их только через import.meta.glob);
// сервер игры и его миграции трогают только таблицы ig_game_<id>_*.
// Запуск: corepack pnpm lint
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/;
const SKIP = new Set(['node_modules', 'dist', 'dev-dist', 'test-results', 'playwright-report']);
// import … from 'x' | export … from 'x' | import 'x' | import('x') | require('x')
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])([^'"\n]+)\1/g;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const file = join(dir, name);
    if (statSync(file).isDirectory()) yield* walk(file);
    else if (SOURCE.test(name)) yield file;
  }
}

const games = existsSync(join(root, 'games')) ? readdirSync(join(root, 'games')) : [];
const gamePackages = new Set(games.map((id) => `@ig/game-${id}`));

/** Зона файла: 'game:<id>', 'shell', 'platform:<name>'. */
function zoneOf(file) {
  const [top, name] = relative(root, file).split(sep);
  if (top === 'games') return `game:${name}`;
  if (top === 'platform') return `platform:${name}`;
  return top;
}

function check(file, specifier) {
  const zone = zoneOf(file);
  const bare = !specifier.startsWith('.') && !specifier.startsWith('/');

  if (bare) {
    const pkg = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];
    if (gamePackages.has(pkg) && zone !== `game:${pkg.slice('@ig/game-'.length)}`) return `пакет другой игры ${pkg}`;
    if (zone.startsWith('game:') && (pkg === '@ig/shell' || pkg === '@ig/server')) return `игре нельзя ${pkg}, только @ig/sdk`;
    if (zone.startsWith('game:') && pkg === '@games') return 'игре нельзя алиас @games';
    if (zone.startsWith('platform:') && pkg === '@games') return 'платформе нельзя алиас @games';
    return null;
  }

  const target = zoneOf(resolve(dirname(file), specifier));
  if (target === zone) return null;
  if (zone.startsWith('game:')) return `выход за пределы своей игры в ${target}`;
  if (target.startsWith('game:')) return `импорт кода игры ${target.slice(5)}`;
  if (zone === 'shell' || zone.startsWith('platform:')) return `относительный импорт в ${target}; связь только через пакеты @ig/*`;
  return null;
}

const problems = [];
for (const top of ['games', 'shell', 'platform']) {
  if (!existsSync(join(root, top))) continue;
  for (const file of walk(join(root, top))) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(IMPORT)) {
      const problem = check(file, match[2]);
      if (problem) {
        const line = source.slice(0, match.index).split('\n').length;
        problems.push(`${relative(root, file)}:${line}  '${match[2]}' — ${problem}`);
      }
    }
  }
}

// Таблицы БД: игра работает только со своими таблицами ig_game_<id>_*.
// В коде сервера игры — строки с именами таблиц, в миграциях — все упоминания public.ig_*.
// Единственное исключение — внешний ключ на профиль ребёнка: references public.ig_children.
const TABLE_IN_CODE = /(['"`])(ig_[a-z0-9_]+)\1/g;
const TABLE_IN_SQL = /(references\s+)?public\.(ig_[a-z0-9_]+)/gi;
for (const id of games) {
  const serverDir = join(root, 'games', id, 'server');
  if (!existsSync(serverDir)) continue;
  const own = `ig_game_${id.replace(/-/g, '_')}_`;
  const report = (file, source, index, table) =>
    problems.push(`${relative(root, file)}:${source.slice(0, index).split('\n').length}  таблица ${table} — игре ${id} можно только ${own}*`);
  for (const file of walk(serverDir)) {
    const source = readFileSync(file, 'utf8');
    for (const m of source.matchAll(TABLE_IN_CODE)) if (!m[2].startsWith(own)) report(file, source, m.index, m[2]);
  }
  const migrations = join(serverDir, 'migrations');
  if (!existsSync(migrations)) continue;
  for (const name of readdirSync(migrations).filter((n) => n.endsWith('.sql'))) {
    const file = join(migrations, name);
    const source = readFileSync(file, 'utf8');
    for (const m of source.matchAll(TABLE_IN_SQL)) {
      const table = m[2].toLowerCase();
      if (table.startsWith(own) || (m[1] && table === 'ig_children')) continue;
      report(file, source, m.index, table);
    }
  }
}

if (problems.length) {
  console.error(`Нарушены границы между играми и платформой (${problems.length}):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('Границы в порядке: игры изолированы, каждая работает только со своими таблицами.');
