import { describe, expect, it } from 'vitest';
import { QUESTS, newlyDone, questState } from '../src/quests';
import { applyChanges, emptyStats, emptyWorld, generateIsland, placeBlock, type World } from '../src/world';

describe('задания', () => {
  it('у всех заданий уникальные id', () => {
    expect(new Set(QUESTS.map((q) => q.id)).size).toBe(QUESTS.length);
  });

  it('случайный остров сам по себе заданий не выполняет', () => {
    for (const seed of [1, 2, 3, 4, 5, 77, 1000]) expect(newlyDone(generateIsland(seed), emptyStats(), [])).toEqual([]);
  });

  it('засчитывает по счётчикам и по постройкам', () => {
    let world: World = emptyWorld();
    for (let y = 0; y < 11; y++) world = applyChanges(world, placeBlock(world, { x: 0, y, z: 0 }, 'stone'));
    const done = newlyDone(world, { ...emptyStats(), boats: 3 }, []).map((q) => q.id);
    expect(done).toEqual(expect.arrayContaining(['tower', 'sailor']));
    expect(done).not.toContain('builder');
  });

  it('выполненное остаётся выполненным, даже если постройку сломали', () => {
    const state = questState(emptyWorld(), emptyStats(), ['tower']);
    expect(state.find((q) => q.quest.id === 'tower')).toMatchObject({ done: true, value: 11 });
    expect(newlyDone(emptyWorld(), { ...emptyStats(), placed: 100 }, ['builder'])).toEqual([]);
  });
});
