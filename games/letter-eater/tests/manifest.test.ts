import { expect, it } from 'vitest';
import { validateManifest } from '@ig/sdk';
import manifest from '../manifest';

it('манифест корректен', () => {
  expect(validateManifest(manifest, 'letter-eater')).toEqual([]);
});
