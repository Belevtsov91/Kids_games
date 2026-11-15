import { describe, expect, it } from 'vitest';
import { accelAt, bodyAt, circularSpeed, DT, launchShip, step, type Body, type Ship } from '../src/game/physics';

const star: Body = { kind: 'sun', x: 0, y: 0, r: 10, mu: 1_000_000, color: '#fff' };

describe('физика', () => {
  it('притяжение направлено к телу и слабеет как 1/r²', () => {
    const near = accelAt({ x: 100, y: 0 }, [star], 0);
    const far = accelAt({ x: 200, y: 0 }, [star], 0);
    expect(near.x).toBeLessThan(0);
    expect(near.y).toBeCloseTo(0);
    expect(near.x / far.x).toBeCloseTo(4);
  });

  it('круговая орбита держится много оборотов', () => {
    const r = 150;
    let s: Ship = { pos: { x: r, y: 0 }, vel: { x: 0, y: circularSpeed(star.mu, r) } };
    const period = (2 * Math.PI * r) / s.vel.y;
    let t = 0;
    for (let i = 0; i < (period * 5) / DT; i++) {
      s = step(s, [star], t);
      t += DT;
      expect(Math.abs(Math.hypot(s.pos.x, s.pos.y) - r)).toBeLessThan(2);
    }
  });

  it('тело на орбите возвращается через период', () => {
    const moon: Body = { ...star, orbit: { cx: 100, cy: 50, r: 40, period: 8, phase: 0 } };
    expect(bodyAt(moon, 0)).toEqual({ x: 140, y: 50 });
    expect(bodyAt(moon, 8).x).toBeCloseTo(140);
    expect(bodyAt(moon, 2).y).toBeCloseTo(90);
  });

  it('старт: ракета у поверхности, курс 90° — вверх', () => {
    const home: Body = { ...star, kind: 'home', x: 50, y: 50 };
    const s = launchShip(home, 90, 100);
    expect(s.pos.x).toBeCloseTo(50);
    expect(s.pos.y).toBeLessThan(50 - home.r);
    expect(s.vel.y).toBeLessThan(0);
  });
});
