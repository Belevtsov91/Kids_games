import { describe, expect, it } from 'vitest';
import { burn, previewPath, simulate, startFlight, advance } from '../src/game/flight';
import { LEVELS } from '../src/game/levels';
import { solve } from './solve';

// Найденные перебором решения, которые собирают все кристаллы: уровни не должны сломаться незаметно.
const KNOWN: Record<string, [number, number, number?]> = {
  'first-launch': [24, 98],
  'heavy-planet': [16, 86],
  detour: [38, 50],
  'around-sun': [28, 50],
  'first-orbit': [28, 58, 2.4],
  slingshot: [24, 66],
  'moving-moon': [40, 98],
  'twin-suns': [18, 50],
  'giant-orbit': [28, 46, 2.4],
  'long-voyage': [46, 54],
};

describe('уровни', () => {
  it('у каждого уровня есть эталонное решение со всеми кристаллами', () => {
    for (const l of LEVELS) {
      const [angle, power, burnAt] = KNOWN[l.id];
      const f = simulate(l, angle, power, burnAt);
      expect(f.status, l.id).toBe('won');
      expect(f.got.every(Boolean), l.id).toBe(true);
    }
  });

  it('решений много — уровень не требует попадания в один градус', () => {
    for (const l of LEVELS.filter((x) => x.burns === 0)) {
      expect(solve(l, { angleStep: 6, powerStep: 8 }).length, l.id).toBeGreaterThanOrEqual(4);
    }
  });

  it('орбиту без тормоза не взять', () => {
    for (const l of LEVELS.filter((x) => x.goal === 'orbit')) {
      expect(solve({ ...l, burns: 0 }, { angleStep: 4, powerStep: 6 }), l.id).toEqual([]);
    }
  });

  it('слабый старт падает домой, пунктир не длиннее подсказки', () => {
    const l = LEVELS[0];
    expect(simulate(l, 80, 10).status).toBe('fell');
    expect(previewPath(l, 30, 50).length).toBeLessThanOrEqual(Math.round(l.preview * 20));
  });

  it('тормоз срабатывает столько раз, сколько разрешено', () => {
    const l = LEVELS.find((x) => x.goal === 'orbit')!;
    const f = startFlight(l, 20, 40);
    advance(f, l, 0.5);
    expect(burn(f)).toBe(true);
    expect(burn(f)).toBe(false);
  });
});
