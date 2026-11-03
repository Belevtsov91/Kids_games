import { describe, expect, it } from 'vitest';
import { addToy, FIELD, makeToy, MAX_TOYS } from '../src/game/toys';

describe('песочница', () => {
  it('бросает игрушку сверху и внутри бортиков', () => {
    const toy = makeToy(1, 'ball', 100, -100);
    expect(toy.position[1]).toBeGreaterThan(0);
    expect(Math.abs(toy.position[0])).toBeLessThan(FIELD);
    expect(Math.abs(toy.position[2])).toBeLessThan(FIELD);
  });

  it('держит не больше MAX_TOYS игрушек, убирая самые старые', () => {
    let toys = [] as ReturnType<typeof makeToy>[];
    for (let i = 0; i < MAX_TOYS + 5; i++) toys = addToy(toys, makeToy(i, 'cube', 0, 0));
    expect(toys).toHaveLength(MAX_TOYS);
    expect(toys[0].id).toBe(5);
  });
});
