import { expect, it } from 'vitest';
import { validateManifest } from '@ig/sdk';
import manifest from '../manifest';
import { STICKERS } from '../src/game/stickers';

it('манифест корректен', () => {
  expect(validateManifest(manifest, 'studio')).toEqual([]);
});

it('все наклейки игры описаны в манифесте', () => {
  const ids = manifest.stickers!.map((s) => s.id);
  expect(ids.sort()).toEqual(Object.values(STICKERS).sort());
});
