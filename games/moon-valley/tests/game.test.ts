import { describe, expect, it } from 'vitest';
import {
  addXp,
  befriend,
  buildGreenhouse,
  calmBoss,
  cleanseSlime,
  collectCrystal,
  initialState,
  MAX_LEVEL,
  openChest,
  PLOT_COUNT,
  restoreState,
  tendPlot,
  xpForNext,
} from '../src/game/valley';

describe('moon valley progression', () => {
  it('uses a seed to plant a first flower', () => expect(tendPlot(initialState(), 0).plots[0].stage).toBe(1));

  it('grows a plant with water and counts the harvest', () => {
    let state = initialState();
    state = tendPlot(state, 2);
    state = tendPlot(state, 2);
    state = tendPlot(state, 2);
    expect(state.plots[2].stage).toBe(3);
    const harvested = tendPlot(state, 2);
    expect(harvested.plots[2].stage).toBe(0);
    expect(harvested.stats.harvested).toBe(1);
    expect(harvested.starlight).toBe(state.starlight + 8);
  });

  it('does nothing without seeds or water', () => {
    const empty = { ...initialState(), seeds: 0 };
    expect(tendPlot(empty, 0)).toBe(empty);
    const dry = { ...tendPlot(initialState(), 0), water: 0 };
    expect(tendPlot(dry, 0)).toBe(dry);
  });

  it('unlocks the owl on level 2 and the frog on level 3', () => {
    const level2 = addXp(initialState(), xpForNext(1));
    expect(level2.level).toBe(2);
    expect(level2.pets.find((pet) => pet.id === 'owl')?.unlocked).toBe(true);
    expect(level2.pets.find((pet) => pet.id === 'bunny')?.unlocked).toBe(false);
    const level3 = addXp(level2, xpForNext(2));
    expect(level3.pets.find((pet) => pet.id === 'bunny')?.unlocked).toBe(true);
  });

  it('stops at the last level without overflowing the xp bar', () => {
    const max = addXp(initialState(), 100_000);
    expect(max.level).toBe(MAX_LEVEL);
    expect(max.xp).toBeLessThanOrEqual(xpForNext(MAX_LEVEL));
  });

  it('counts crystals, cleansed slimes, chests and the boss', () => {
    let state = collectCrystal(initialState());
    state = cleanseSlime(cleanseSlime(state), true);
    state = openChest(openChest(state, 'lake'), 'lake');
    state = calmBoss(calmBoss(state));
    expect(state.stats).toEqual({ harvested: 0, crystals: 1, cleansed: 2, boss: 1, chests: 1 });
    expect(state.opened).toEqual(['lake']);
  });

  it('builds the greenhouse only with enough starlight', () => {
    const poor = { ...initialState(), starlight: 5 };
    expect(buildGreenhouse(poor)).toBe(poor);
    const built = buildGreenhouse({ ...initialState(), starlight: 20 });
    expect(built.buildings).toContain('greenhouse');
    expect(built.starlight).toBe(5);
    expect(buildGreenhouse(built)).toBe(built);
  });

  it('befriends only unlocked pets', () => {
    const state = befriend(befriend(befriend(initialState(), 'fox'), 'fox'), 'fox');
    expect(state.pets[0].affection).toBe(60);
    expect(befriend(state, 'owl')).toBe(state);
  });

  it('restores broken or old saves safely', () => {
    expect(restoreState(null)).toEqual(initialState());
    const restored = restoreState({ level: 3, seeds: -4, plots: [{ id: 1, stage: 9 }], pets: 'oops', stats: { cleansed: 'x' }, quest: { index: 2, active: 1 } });
    expect(restored.level).toBe(3);
    expect(restored.seeds).toBe(0);
    expect(restored.plots).toHaveLength(PLOT_COUNT);
    expect(restored.plots[1].stage).toBe(3);
    expect(restored.pets.find((pet) => pet.id === 'bunny')?.unlocked).toBe(true);
    expect(restored.stats.cleansed).toBe(0);
    expect(restored.quest).toEqual({ index: 2, active: false, base: 0 });
  });

  it('keeps an old three-plot save', () => {
    const restored = restoreState({ level: 2, plots: [{ id: 0, stage: 2 }, { id: 1, stage: 1 }, { id: 2, stage: 0 }] });
    expect(restored.plots.map((plot) => plot.stage)).toEqual([2, 1, 0, 0, 0, 0]);
  });
});
