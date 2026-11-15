import { expect, it } from 'vitest';
import { validateManifest } from '@ig/sdk';
import manifest from '../manifest';
import { LEVEL_STICKERS } from '../src/game/day';

it('манифест корректен', () => {
  expect(validateManifest(manifest, 'clock')).toEqual([]);
});

it('у каждого уровня есть наклейка, у наклеек есть переводы', () => {
  const ids = manifest.stickers?.map((s) => s.id) ?? [];
  for (const id of LEVEL_STICKERS) expect(ids).toContain(id);
  for (const s of manifest.stickers ?? []) expect(Object.keys(s.titles ?? {}).sort()).toEqual(['en', 'ro', 'uk']);
});
