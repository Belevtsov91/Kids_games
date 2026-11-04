import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { FastifyPluginAsync } from 'fastify';
import { buildCatalog, type GameManifest } from '@ig/sdk/manifest';
import type { GameServerOptions } from '@ig/sdk/server';

export interface LoadedGame {
  manifest: GameManifest;
  /** Серверная часть игры (`games/<id>/server/index.ts`), если она есть. */
  plugin: FastifyPluginAsync<GameServerOptions> | null;
  /** Таблицы игры из её миграций (ig_game_<id>_*): по ним кабинет выгружает данные детей. */
  tables: string[];
}

const TABLE = /create\s+table\s+if\s+not\s+exists\s+(?:public\.)?(ig_game_[a-z0-9_]+)/gi;

/** Имена таблиц из server/migrations/*.sql игры. */
export function gameTables(gamesDir: string, id: string): string[] {
  const dir = join(gamesDir, id, 'server', 'migrations');
  if (!existsSync(dir)) return [];
  const names = new Set<string>();
  for (const file of readdirSync(dir).filter((n) => n.endsWith('.sql'))) {
    for (const m of readFileSync(join(dir, file), 'utf8').matchAll(TABLE)) names.add(m[1].toLowerCase());
  }
  return [...names];
}

const importDefault = async (file: string) => (await import(pathToFileURL(file).href)).default;

/**
 * Находит игры в `gamesDir`: каждая папка с manifest.ts — игра.
 * Сервер не знает игры по именам: добавили папку — игра появилась, удалили — пропала.
 */
export async function loadGames(gamesDir: string, onError: (message: string) => void): Promise<LoadedGame[]> {
  const folders = existsSync(gamesDir)
    ? readdirSync(gamesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(join(gamesDir, d.name, 'manifest.ts')))
        .map((d) => d.name)
    : [];

  const manifests: [string, unknown][] = [];
  for (const folder of folders) {
    try {
      manifests.push([folder, await importDefault(join(gamesDir, folder, 'manifest.ts'))]);
    } catch (err) {
      onError(`${folder}: не удалось прочитать manifest.ts: ${String(err)}`);
    }
  }

  const games: LoadedGame[] = [];
  for (const manifest of buildCatalog(manifests, onError)) {
    const serverEntry = join(gamesDir, manifest.id, 'server', 'index.ts');
    let plugin: LoadedGame['plugin'] = null;
    // Сервер игры с ошибкой не роняет платформу: игра остаётся в каталоге, её API просто нет.
    if (existsSync(serverEntry)) {
      try {
        plugin = await importDefault(serverEntry);
      } catch (err) {
        onError(`${manifest.id}: не удалось загрузить server/index.ts: ${String(err)}`);
      }
    }
    games.push({ manifest, plugin, tables: gameTables(gamesDir, manifest.id) });
  }
  return games;
}
