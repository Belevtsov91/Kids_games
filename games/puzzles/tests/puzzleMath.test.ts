import { describe, expect, it } from 'vitest';
import { fits, gridForLevel, piecePosition, recommendedGrid } from '../src/game/puzzleMath';

describe('recommendedGrid', () => {
  it('keeps the recommendation playable', () => {
    const grid = recommendedGrid(1920, 1080);
    expect(grid.cols * grid.rows).toBeGreaterThanOrEqual(4);
    expect(grid.cols * grid.rows).toBeLessThanOrEqual(36);
  });
});

describe('levels', () => {
  it('gives the chosen number of pieces for a square picture', () => {
    expect(gridForLevel(1024, 1024, 'easy')).toEqual({ cols: 2, rows: 2 });
    expect(gridForLevel(1024, 1024, 'medium')).toEqual({ cols: 3, rows: 3 });
    expect(gridForLevel(1024, 1024, 'expert')).toEqual({ cols: 5, rows: 5 });
  });

  it('keeps pieces close to square for a wide picture', () => {
    const grid = gridForLevel(1600, 900, 'hard');
    expect(grid.cols).toBeGreaterThan(grid.rows);
  });
});

describe('pieces', () => {
  it('fit only their own place', () => {
    expect(fits(3, 3)).toBe(true);
    expect(fits(3, 4)).toBe(false);
  });

  it('cut the right part of the picture', () => {
    expect(piecePosition(0, { cols: 3, rows: 3 })).toBe('0% 0%');
    expect(piecePosition(8, { cols: 3, rows: 3 })).toBe('100% 100%');
  });
});
