import { describe, expect, it } from 'vitest';
import { betterTurned, cellSize, fitGrid, levelFits, MIN_CELL } from '../src/game/boardFit';
import { dropTarget } from '../src/game/snap';
import { loadProgress, saveProgress } from '../src/storage/progress';

const phone = { width: 390, height: 844 };
const smallPhone = { width: 360, height: 640 };
const tablet = { width: 820, height: 1180 };

describe('board fit', () => {
  it('keeps 49 pieces finger-sized on a phone and a tablet', () => {
    expect(levelFits(phone, 'legend')).toBe(true);
    expect(levelFits(tablet, 'legend')).toBe(true);
    expect(cellSize(tablet, 1.5, { cols: 8, rows: 6 })).toBeGreaterThan(80);
  });

  it('locks 49 on a tiny phone and shrinks a wide picture to fit a small one', () => {
    expect(levelFits({ width: 320, height: 568 }, 'legend')).toBe(false);
    expect(levelFits({ width: 320, height: 568 }, 'expert')).toBe(true);
    const grid = fitGrid(smallPhone, 1536, 1024, { cols: 8, rows: 6 });
    expect(cellSize(smallPhone, 1.5, grid)).toBeGreaterThanOrEqual(MIN_CELL);
    expect(grid.cols * grid.rows).toBeLessThan(48);
  });

  it('suggests turning a phone when cells get bigger', () => {
    expect(betterTurned({ width: 844, height: 390 }, 1, { cols: 7, rows: 7 })).toBe(true);
    expect(betterTurned(phone, 1.5, { cols: 2, rows: 2 })).toBe(false);
  });
});

describe('drop target', () => {
  const grid = { cols: 8, rows: 6 };

  it('snaps a piece dropped near its place', () => {
    // деталь 9 — столбец 1, строка 1; центр клетки (1.5, 1.5)
    expect(dropTarget(9, 2.1, 1.9, grid)).toEqual({ cell: 9, near: true, under: 10 });
  });

  it('reports the cell under the piece when it is far from its place', () => {
    expect(dropTarget(9, 5.5, 4.5, grid)).toEqual({ cell: 37, near: false, under: 37 });
  });

  it('returns nothing outside the board', () => {
    expect(dropTarget(9, -2, 1, grid)).toBeNull();
    expect(dropTarget(9, 4, 9, grid)).toBeNull();
  });
});

describe('progress', () => {
  const memory = () => {
    const data = new Map<string, string>();
    return {
      load: <T,>(key: string) => (data.has(key) ? (JSON.parse(data.get(key)!) as T) : null),
      save: (key: string, value: unknown) => void data.set(key, JSON.stringify(value)),
    };
  };

  it('saves, restores and clears a started puzzle per profile', () => {
    const storage = memory();
    const progress = { grid: { cols: 8, rows: 6 }, placed: [0, 1, 9] };
    saveProgress(storage, 'kid', 'turtle', progress);
    expect(loadProgress(storage, 'kid', 'turtle')).toEqual(progress);
    expect(loadProgress(storage, 'other', 'turtle')).toBeNull();
    saveProgress(storage, 'kid', 'turtle', null);
    expect(loadProgress(storage, 'kid', 'turtle')).toBeNull();
  });

  it('ignores broken saves', () => {
    const storage = memory();
    storage.save('progress:kid:turtle', { grid: { cols: 2, rows: 2 }, placed: [7] });
    expect(loadProgress(storage, 'kid', 'turtle')).toBeNull();
  });
});
