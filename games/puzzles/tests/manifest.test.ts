import { describe, expect, it } from 'vitest';
import manifest from '../manifest';
import { validateManifest } from '@ig/sdk';

describe('puzzles manifest', () => {
  it('is valid', () => expect(validateManifest(manifest, 'puzzles')).toEqual([]));
});
