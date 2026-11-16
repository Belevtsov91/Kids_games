import { mergeCreations, type Creation, type CreationsModule, type GameManifest } from '@ig/sdk';
import { games } from '@/catalog/catalog';

// Какие игры умеют показывать работы ребёнка родителю: у них есть games/<id>/src/creations.ts.
// Оболочка не знает игры по именам: новая игра с таким файлом появится на странице «Творчество» сама.
const files = import.meta.glob<CreationsModule>('@games/*/src/creations.{ts,tsx}', { import: 'default' });
const folderOf = (path: string) => /(?:^|\/)games\/([^/]+)\/src\/creations\.tsx?$/.exec(path)?.[1] ?? path;
const loaders = new Map(Object.entries(files).map(([path, load]) => [folderOf(path), load]));

export interface CreativeGame {
  game: GameManifest;
  load: () => Promise<CreationsModule>;
}

/** Игры с работами, в порядке каталога. */
export function creativeGames(catalog: readonly GameManifest[] = games): CreativeGame[] {
  return catalog.flatMap((game) => {
    const load = loaders.get(game.id);
    return load ? [{ game, load }] : [];
  });
}

/** Работа в общей ленте: знает свою игру и модуль, который её нарисует. */
export interface FeedItem extends Creation {
  key: string;
  game: GameManifest;
  module: CreationsModule;
}

/**
 * Собирает ленту из всех игр. Игра, чей сервер не ответил, не роняет страницу: её работ просто нет,
 * а id таких игр возвращаются в `failed`, чтобы честно сказать «не всё загрузилось».
 */
export async function loadFeed(
  sources: readonly CreativeGame[],
  list: (module: CreationsModule, game: GameManifest) => Promise<Creation[]>,
): Promise<{ items: FeedItem[]; failed: string[] }> {
  const failed: string[] = [];
  const lists = await Promise.all(
    sources.map(async ({ game, load }) => {
      try {
        const module = await load();
        const items = await list(module, game);
        return items.map((c): FeedItem => ({ ...c, key: `${game.id}:${c.id}`, game, module }));
      } catch {
        failed.push(game.id);
        return [];
      }
    }),
  );
  return { items: mergeCreations(lists), failed };
}
