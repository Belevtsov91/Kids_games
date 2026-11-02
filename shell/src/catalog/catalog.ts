import { buildCatalog, type GameManifest, type GameModule } from '@ig/sdk';

// Единственное место, где оболочка видит папку games/. Манифесты маленькие и грузятся сразу,
// код игры — отдельным чанком только при запуске. Новая папка с manifest.ts появляется в меню сама.
const manifests = import.meta.glob<GameManifest>('@games/*/manifest.ts', { eager: true, import: 'default' });
const entries = import.meta.glob<GameModule>('@games/*/src/index.{ts,tsx}', { import: 'default' });

// Ключи glob — пути вида …/games/<папка>/manifest.ts; id игры обязан совпадать с именем папки.
const folderOf = (path: string) => /(?:^|\/)games\/([^/]+)\/(?:manifest\.ts|src\/index\.tsx?)$/.exec(path)?.[1] ?? path;

const loaders = new Map(Object.entries(entries).map(([path, load]) => [folderOf(path), load]));

export const games: GameManifest[] = buildCatalog(
  Object.entries(manifests)
    .filter(([path]) => loaders.has(folderOf(path)))
    .map(([path, manifest]) => [folderOf(path), manifest]),
);

export const findGame = (id: string | undefined) => games.find((g) => g.id === id);

export const loadGame = (id: string) => {
  const load = loaders.get(id);
  if (!load) throw new Error(`Нет точки входа для игры ${id}`);
  return load();
};
