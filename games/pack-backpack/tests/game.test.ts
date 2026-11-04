import { describe, expect, it } from 'vitest';
import { emptyProgress, isOpen, readProgress, recordTrip } from '../src/game/progress';
import { buildShelf, extrasFor, isReady, ITEM_ART, pack, TRIPS } from '../src/game/trips';

const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe('поездки', () => {
  it.each(TRIPS.map((t) => [t.id, t] as const))('%s: у всех вещей есть картинка, нужное и лишнее не пересекаются', (_, t) => {
    for (const i of [...t.need, ...t.wrong]) expect(ITEM_ART[i]).toBeTruthy();
    expect(t.need.some((i) => t.wrong.includes(i))).toBe(false);
    expect(t.wrong.length).toBeGreaterThanOrEqual(5);
  });
  it('полка: всё нужное плюс лишнее', () => {
    const shelf = buildShelf(TRIPS[0], extrasFor(0), rng(5));
    expect(shelf).toHaveLength(TRIPS[0].need.length + 2);
    for (const i of TRIPS[0].need) expect(shelf).toContain(i);
    expect(extrasFor(10)).toBe(5);
  });
  it('собираем рюкзак', () => {
    const trip = TRIPS[0];
    const packed = new Set<string>();
    expect(pack(trip, packed, 'swimsuit')).toBe('wrong');
    for (const i of trip.need) {
      expect(pack(trip, packed, i)).toBe('packed');
      packed.add(i);
    }
    expect(pack(trip, packed, 'umbrella')).toBe('already');
    expect(isReady(trip, packed)).toBe(true);
  });
});

describe('прогресс', () => {
  it('открывает поездки по одной', () => {
    let p = emptyProgress();
    expect(isOpen(p, 3)).toBe(false);
    p = recordTrip(recordTrip(p, 'rain'), 'rain');
    expect(p.done.rain).toBe(2);
    expect(isOpen(p, 3)).toBe(true);
    expect(isOpen(p, 4)).toBe(false);
    expect(readProgress({ done: { rain: 2, nope: 4, snow: -1 } })).toEqual({ done: { rain: 2 } });
  });
});
