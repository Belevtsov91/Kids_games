import { describe, expect, it } from 'vitest';
import { validateManifest } from '@ig/sdk';
import manifest from '../manifest';

describe('manifest', () => {
  it('is valid', () => expect(validateManifest(manifest, 'moon-valley')).toEqual([]));
});
