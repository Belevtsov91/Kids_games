import { describe, expect, it } from 'vitest';
import { PICTURES } from '../src/game/pictures';
import { emptyProgress, isOpen, markDone, readProgress } from '../src/game/progress';
import { findSlot, nearestSlot, shapePath, type Piece } from '../src/game/shapes';

describe('картинки', () => {
  it.each(PICTURES.map((p) => [p.id, p] as const))('%s: фигуры в рамке, квадраты и круги ровные', (_, pic) => {
    expect(pic.pieces.length).toBeGreaterThanOrEqual(3);
    for (const p of pic.pieces) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x + p.w).toBeLessThanOrEqual(100);
      expect(p.y + p.h).toBeLessThanOrEqual(100);
      if (p.type === 'square' || p.type === 'circle') expect(p.w).toBe(p.h);
    }
  });
  it('сложность растёт', () => {
    expect(PICTURES[0].pieces.length).toBeLessThan(PICTURES.at(-1)!.pieces.length);
  });
});

describe('фигуры', () => {
  const slots: Piece[] = [
    { type: 'circle', x: 0, y: 0, w: 20, h: 20, color: 'red' },
    { type: 'circle', x: 60, y: 0, w: 20, h: 20, color: 'red' },
    { type: 'square', x: 0, y: 60, w: 20, h: 20, color: 'red' },
  ];
  it('ставит фигуру на ближайшее свободное место своей формы', () => {
    expect(findSlot(slots, new Set(), 'circle', { x: 65, y: 12 })).toBe(1);
    expect(findSlot(slots, new Set([1]), 'circle', { x: 65, y: 12 })).toBeNull();
    expect(findSlot(slots, new Set(), 'triangle', { x: 10, y: 10 })).toBeNull();
    expect(nearestSlot(slots, new Set(), { x: 9, y: 72 })).toBe(2);
  });
  it('рисует контуры', () => {
    expect(shapePath({ type: 'square', x: 0, y: 0, w: 10, h: 10 })).toBe('M0,0h10v10h-10Z');
    expect(shapePath({ type: 'star', x: 0, y: 0, w: 10, h: 10 }).split('L')).toHaveLength(10);
  });
});

describe('прогресс', () => {
  it('открывает картинки по одной', () => {
    let p = emptyProgress();
    expect(isOpen(p, 2)).toBe(true);
    expect(isOpen(p, 3)).toBe(false);
    p = markDone(markDone(p, 'house'), 'house');
    expect(p.done).toEqual(['house']);
    expect(isOpen(p, 3)).toBe(true);
    expect(readProgress({ done: ['house', 'nope'], free: [{ type: 'blob' }] })).toEqual({ done: ['house'], free: [] });
  });
});
