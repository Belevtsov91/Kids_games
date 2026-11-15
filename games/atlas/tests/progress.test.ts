import { describe, expect, it } from 'vitest';
import { centerOf, clampToEdge, densify, fitZoom, lonDelta, project, ringPath } from '../src/game/globe';
import { FLAG_MASTER, emptyProgress, isOpen, readProgress, recordRound, stickersFor } from '../src/game/progress';

describe('сохранение', () => {
  it('испорченное сохранение превращается в пустое', () => {
    expect(readProgress(null)).toEqual(emptyProgress());
    expect(readProgress({ stars: { home: 9, europe: 'x' }, flags: -3, visited: ['md', 'zz', 'md'] })).toEqual({
      stars: { home: 3, europe: 0, world: 0 },
      flags: 0,
      visited: ['md'],
    });
  });

  it('маршруты открываются по очереди', () => {
    const p = emptyProgress();
    expect(isOpen('home', p)).toBe(true);
    expect(isOpen('europe', p)).toBe(false);
    p.stars.home = 1;
    expect(isOpen('europe', p)).toBe(true);
    expect(isOpen('world', p)).toBe(false);
    p.stars.europe = 2;
    expect(isOpen('world', p)).toBe(true);
  });

  it('лучшие звёзды остаются, флаги копятся, наклейки выдаются', () => {
    const r = { region: 'home' as const, correct: 10, total: 10, stars: 3, flagsRight: 4, visited: ['md' as const] };
    let p = recordRound(emptyProgress(), r);
    p = recordRound(p, { ...r, correct: 6, stars: 1 });
    expect(p.stars.home).toBe(3);
    expect(p.flags).toBe(8);
    expect(p.visited).toEqual(['md']);
    expect(stickersFor(p, r)).toEqual(['first-flight', 'home-route', 'perfect-route']);
    const master = { ...p, flags: FLAG_MASTER, stars: { home: 3, europe: 3, world: 3 } };
    expect(stickersFor(master, r)).toContain('flag-master');
    expect(stickersFor(master, r)).toContain('globe-trotter');
  });
});

describe('глобус', () => {
  it('точка в центре вида — в центре круга, обратная сторона не видна', () => {
    const c = project(47, 28, { lat: 47, lon: 28 });
    expect(c.front).toBe(true);
    expect(Math.abs(c.x) + Math.abs(c.y)).toBeLessThan(1e-9);
    expect(project(-47, -152, { lat: 47, lon: 28 }).front).toBe(false);
  });

  it('невидимая точка прижимается к краю', () => {
    const p = clampToEdge({ x: 0.3, y: 0.4, front: false });
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(1);
  });

  it('материк за горизонтом не рисуется', () => {
    const ring = densify([[0, 0], [10, 0], [10, 10]]);
    expect(ringPath(ring, { lat: 0, lon: 5 }, 100, 100, 90)).toMatch(/^M.*Z$/);
    expect(ringPath(ring, { lat: 0, lon: 185 }, 100, 100, 90)).toBeNull();
  });

  it('глобус крутится коротким путём', () => {
    expect(lonDelta(170, -170)).toBe(20);
    expect(lonDelta(-170, 170)).toBe(-20);
  });

  it('центр нескольких точек между ними', () => {
    const v = centerOf([{ lat: 0, lon: 10 }, { lat: 0, lon: 30 }]);
    expect(v.lat).toBeCloseTo(0);
    expect(v.lon).toBeCloseTo(20);
  });
});

describe('увеличение глобуса', () => {
  it('близкие точки — крупно, далёкие — весь шар', () => {
    const c = { lat: 47, lon: 28 };
    expect(fitZoom(c, [{ lat: 50, lon: 30 }])).toBe(3);
    expect(fitZoom(c, [{ lat: -35, lon: 149 }])).toBe(1);
  });
});
