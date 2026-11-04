import { expect, it } from 'vitest';
import { validateManifest } from '@ig/sdk';
import manifest from '../manifest';
import { PAJAMAS } from '../src/game/logic';

it('манифест корректен', () => {
  expect(validateManifest(manifest, 'sleepy-bear')).toEqual([]);
});

it('у каждой пижамы есть наклейка', () => {
  const ids = manifest.stickers?.map((s) => s.id) ?? [];
  for (const p of PAJAMAS) expect(ids).toContain(`pajama-${p}`);
});
