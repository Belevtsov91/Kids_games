import { describe, expect, it } from 'vitest';
import { recommendedGrid } from '../src/game/puzzleMath';

describe('recommendedGrid', () => {
  it('keeps the recommendation playable', () => {
    const grid = recommendedGrid(1920, 1080);
    expect(grid.cols * grid.rows).toBeGreaterThanOrEqual(4);
    expect(grid.cols * grid.rows).toBeLessThanOrEqual(36);
  });
});
