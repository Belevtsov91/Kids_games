import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { FastifyPluginAsync } from 'fastify';
import { buildCatalog, type GameManifest } from '@ig/sdk/manifest';
import type { GameServerOptions } from '@ig/sdk/server';

export interface LoadedGame {
  manifest: GameManifest;
  /** Серверная часть игры (`games/<id>/server/index.ts`), если она есть. */
  plugin: FastifyPluginAsync<GameServerOptions> | null;
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
    games.push({ manifest, plugin: existsSync(serverEntry) ? await importDefault(serverEntry) : null });
  }
  return games;
}
