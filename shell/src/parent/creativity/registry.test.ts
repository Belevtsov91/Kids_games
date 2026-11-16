import { describe, expect, it } from 'vitest';
import type { Creation, CreationsModule, GameManifest } from '@ig/sdk';
import { creativeGames, loadFeed, type CreativeGame } from './registry';

const game = (id: string): GameManifest => ({ id, title: id, emoji: '🎨', kind: '2d', ages: { min: 3, max: 15 } });
const item = (id: string, createdAt: string): Creation => ({ id, title: id, createdAt, kind: 'picture' });
const source = (id: string, list: () => Promise<Creation[]>): CreativeGame => ({
  game: game(id),
  load: async () => ({ list, mount: () => ({ unmount() {} }) }) as CreationsModule,
});

describe('реестр творчества', () => {
  it('находит игры с creations.ts сам, без списка имён', () => {
    const ids = creativeGames().map((g) => g.game.id);
    expect(ids).toEqual(expect.arrayContaining(['drawing', 'animal-orchestra', 'studio']));
    expect(ids).not.toContain('counting');
  });

  it('сливает ленты игр, новые сверху, ключ уникален между играми', async () => {
    const { items, failed } = await loadFeed(
      [source('a', async () => [item('1', '2026-11-01T00:00:00Z')]), source('b', async () => [item('1', '2026-11-05T00:00:00Z')])],
      (module) => module.list({} as never),
    );
    expect(failed).toEqual([]);
    expect(items.map((x) => x.key)).toEqual(['b:1', 'a:1']);
    expect(items[0]!.game.id).toBe('b');
  });

  it('упавшая игра не роняет ленту и попадает в failed', async () => {
    const { items, failed } = await loadFeed(
      [source('ok', async () => [item('1', '2026-11-01T00:00:00Z')]), source('down', () => Promise.reject(new Error('503')))],
      (module) => module.list({} as never),
    );
    expect(items.map((x) => x.key)).toEqual(['ok:1']);
    expect(failed).toEqual(['down']);
  });
});
