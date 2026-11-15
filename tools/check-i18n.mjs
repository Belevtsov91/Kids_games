// Проверка переводов: ключи сверяет TypeScript (все словари типизированы по русскому),
// а этот скрипт ловит то, чего типы не видят: строку, которую забыли перевести.
// - в en и ro не должно быть кириллицы;
// - в uk не должно быть чисто русских букв ы, э, ъ, ё.
// Комментарии и поле art (имя картинки, общее для всех языков) не проверяем. Исключение на строку: комментарий «i18n-ok» в ней.
// Запуск: node tools/check-i18n.mjs (входит в corepack pnpm lint)

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SKIP = new Set(['node_modules', 'dist', 'dev-dist', 'test-results', 'playwright-report']);
const TEXT_DIRS = new Set(['i18n', 'text', 'dict', 'packs']);
const RULES = {
  en: { bad: /[Ѐ-ӿ]/, what: 'кириллица в английском' },
  ro: { bad: /[Ѐ-ӿ]/, what: 'кириллица в румынском' },
  uk: { bad: /[ыэъёЫЭЪЁ]/, what: 'русская буква в украинском' },
};

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const file = join(dir, name);
    if (statSync(file).isDirectory()) yield* walk(file);
    else yield file;
  }
}

/** Убирает комментарии, сохраняя номера строк. Строки с // внутри кавычек (адреса) не трогаем. */
function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((line) => line.replace(/(^|[^:'"`\w])\/\/.*$/, '$1'))
    .join('\n');
}

const problems = [];
for (const top of ['shell', 'games', 'admin', 'platform']) {
  for (const file of walk(join(root, top))) {
    const lang = basename(file).replace(/\.(ts|tsx)$/, '').replace(/\d+$/, '');
    const rule = RULES[lang];
    if (!rule || !/\.(ts|tsx)$/.test(file) || !TEXT_DIRS.has(basename(dirname(file)))) continue;
    const raw = readFileSync(file, 'utf8').split('\n');
    stripComments(raw.join('\n'))
      .split('\n')
      .forEach((line, i) => {
        line = line.replace(/\bart:\s*'[^']*'/g, '');
        if (rule.bad.test(line) && !raw[i].includes('i18n-ok')) problems.push(`${relative(root, file)}:${i + 1}: ${rule.what}: ${line.trim().slice(0, 90)}`);
      });
  }
}

if (problems.length) {
  console.error(`Непереведённые строки (${problems.length}):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('Переводы в порядке: в en/ro нет кириллицы, в uk нет русских букв.');
