// Новая игра из шаблона: corepack pnpm new-game <id> "Название"
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const [id, title = id] = process.argv.slice(2);

if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) {
  console.error('Использование: corepack pnpm new-game <id> "Название"\n  id: латиница в нижнем регистре, цифры, дефис (например, puzzle-animals)');
  process.exit(1);
}

const target = join(root, 'games', id);
if (existsSync(target)) {
  console.error(`Папка games/${id} уже существует`);
  process.exit(1);
}

cpSync(join(root, 'tools', 'game-template'), target, { recursive: true });

const fill = (dir) => {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) fill(file);
    else writeFileSync(file, readFileSync(file, 'utf8').replaceAll('__GAME_ID__', id).replaceAll('__GAME_TITLE__', title));
  }
};
fill(target);

console.log(`Готово: games/${id}
Дальше:
  corepack pnpm install        подтянуть зависимости новой игры
  corepack pnpm dev            игра уже в меню`);
