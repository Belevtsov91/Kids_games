import { describe, expect, it } from 'vitest';
import type { GameStorage } from '@ig/sdk';
import { limitForAge, loadSaved } from '../src/app/savedState';

const storage = (value: unknown): GameStorage => ({ load: () => value as never, save: () => undefined });

describe('starting range by age', () => {
  it('picks a bigger range for older children', () => {
    expect(limitForAge(3)).toBe(5);
    expect(limitForAge(5)).toBe(10);
    expect(limitForAge(8)).toBe(20);
    expect(limitForAge(null)).toBe(5);
  });
  it('uses the age only when nothing is saved yet', () => {
    expect(loadSaved(storage(null), 'k', 7)?.prefs.limit).toBe(20);
    expect(loadSaved(storage({ preferences: { limit: 5 } }), 'k', 7)?.prefs.limit).toBe(5);
  });
});
