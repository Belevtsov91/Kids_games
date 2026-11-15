import { expect, it } from 'vitest';
import { validateManifest } from '@ig/sdk';
import manifest from '../manifest';

it('манифест корректен', () => {
  expect(validateManifest(manifest, 'eco')).toEqual([]);
});

it('наклейки, которые выдаёт игра, есть в манифесте', () => {
  const ids = manifest.stickers?.map((s) => s.id) ?? [];
  for (const id of ['first-light', 'wind-power', 'night-keeper', 'thrifty', 'eco-mayor']) expect(ids).toContain(id);
});
