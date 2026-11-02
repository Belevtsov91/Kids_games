import { describe, expect, it } from 'vitest';
import manifest from '../manifest';
import { validateManifest } from '@ig/sdk';

describe('counting manifest', () => {
  it('is valid', () => expect(validateManifest(manifest, 'counting')).toEqual([]));
});
