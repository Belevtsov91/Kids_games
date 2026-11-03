import { describe, expect, it } from 'vitest';
import { fits, gridFor, gridForLevel, isEdge, piecePosition, recommendedGrid } from '../src/game/puzzleMath';

const count = (grid: { cols: number; rows: number }) => grid.cols * grid.rows;

describe('recommendedGrid', () => {
  it('keeps the recommendation playable', () => {
    const grid = recommendedGrid(1920, 1080);
    expect(count(grid)).toBeGreaterThanOrEqual(4);
    expect(count(grid)).toBeLessThanOrEqual(36);
  });
});

describe('levels', () => {
  it('gives the chosen number of pieces for a square picture', () => {
    expect(gridForLevel(1024, 1024, 'easy')).toEqual({ cols: 2, rows: 2 });
    expect(gridForLevel(1024, 1024, 'medium')).toEqual({ cols: 3, rows: 3 });
    expect(gridForLevel(1024, 1024, 'expert')).toEqual({ cols: 5, rows: 5 });
    expect(gridForLevel(1024, 1024, 'master')).toEqual({ cols: 6, rows: 6 });
    expect(gridForLevel(1024, 1024, 'legend')).toEqual({ cols: 7, rows: 7 });
  });

  it('gets close to the chosen number for a 3:2 picture', () => {
    expect(gridForLevel(1536, 1024, 'hard')).toEqual({ cols: 5, rows: 3 });
    expect(gridForLevel(1536, 1024, 'expert')).toEqual({ cols: 6, rows: 4 });
    expect(gridForLevel(1536, 1024, 'master')).toEqual({ cols: 7, rows: 5 });
    expect(gridForLevel(1536, 1024, 'legend')).toEqual({ cols: 8, rows: 6 });
  });

  it('keeps pieces close to square for a wide picture', () => {
    const grid = gridForLevel(1600, 900, 'hard');
    expect(grid.cols).toBeGreaterThan(grid.rows);
  });

  it('never goes above 54 pieces or 10 per side', () => {
    for (const [w, h] of [[4000, 500], [500, 4000], [1024, 1024]]) {
      const grid = gridFor(w, h, 200);
      expect(count(grid)).toBeLessThanOrEqual(54);
      expect(Math.max(grid.cols, grid.rows)).toBeLessThanOrEqual(10);
    }
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

  it('know whether they are on the edge', () => {
    const grid = { cols: 4, rows: 3 };
    expect([0, 3, 4, 7, 8, 11].every((piece) => isEdge(piece, grid))).toBe(true);
    expect(isEdge(5, grid)).toBe(false);
    expect(isEdge(6, grid)).toBe(false);
  });
});
