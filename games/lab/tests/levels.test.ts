import { beforeAll, describe, expect, it } from 'vitest';
import R from '@dimforge/rapier3d-compat';
import { LEVELS } from '../src/game/levels';
import { canPlace, machineOf } from '../src/game/board';
import { partInfo, type Placed } from '../src/game/parts';
import { simulate } from '../src/sim/run';

beforeAll(async () => {
  await R.init();
});

const asPlaced = (parts: Omit<Placed, 'id'>[]): Placed[] => parts.map((p, i) => ({ ...p, id: i }));

describe.each(LEVELS.map((level, i) => [i + 1, level] as const))('уровень %i', (_, level) => {
  it('без деталей лампа не зажигается', () => {
    expect(simulate(R, level, machineOf(level, [])).outcome).toBe('lost');
  });

  it('решение Тёпы зажигает лампу и собирает звёздочку', () => {
    const result = simulate(R, level, machineOf(level, asPlaced(level.solution)));
    expect(result.outcome).toBe('lit');
    expect(result.star).toBe(true);
  });

  it('решение можно собрать из запаса деталей по правилам доски', () => {
    const placed: Placed[] = [];
    for (const part of asPlaced(level.solution)) {
      expect(canPlace(level, placed, part.col, part.row)).toBe(true);
      expect(part.variant).toBeLessThan(partInfo(part.kind).variants);
      placed.push(part);
    }
    for (const part of placed) expect(placed.filter((p) => p.kind === part.kind).length).toBeLessThanOrEqual(level.inventory[part.kind] ?? 0);
    expect(level.solution.length).toBeLessThanOrEqual(level.par);
  });
});

it('у уровней разные id', () => {
  expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
});
