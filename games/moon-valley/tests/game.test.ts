import { describe, expect, it } from 'vitest';
import { addXp, initialState, restoreState, tendPlot, xpForNext } from '../src/game/valley';

describe('moon valley progression', () => {
  it('uses a seed to plant a first flower', () => expect(tendPlot(initialState(), 0).plots[0].stage).toBe(1));

  it('unlocks the owl on level 2 and the bunny on level 3', () => {
    const level2 = addXp(initialState(), xpForNext(1));
    expect(level2.level).toBe(2);
    expect(level2.pets.find((pet) => pet.id === 'owl')?.unlocked).toBe(true);
    expect(level2.pets.find((pet) => pet.id === 'bunny')?.unlocked).toBe(false);
    const level3 = addXp(level2, xpForNext(2));
    expect(level3.pets.find((pet) => pet.id === 'bunny')?.unlocked).toBe(true);
  });

  it('stops at the last level without overflowing the xp bar', () => {
    const max = addXp(initialState(), 100_000);
    expect(max.level).toBe(5);
    expect(max.xp).toBeLessThanOrEqual(xpForNext(5));
  });

  it('restores broken or old saves safely', () => {
    expect(restoreState(null)).toEqual(initialState());
    const restored = restoreState({ level: 3, seeds: -4, plots: [{ id: 1, stage: 9 }], pets: 'oops' });
    expect(restored.level).toBe(3);
    expect(restored.seeds).toBe(0);
    expect(restored.plots[1].stage).toBe(3);
    expect(restored.pets.find((pet) => pet.id === 'bunny')?.unlocked).toBe(true);
  });
});
