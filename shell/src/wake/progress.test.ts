import { describe, expect, it } from 'vitest';
import { HOLD, hintIndex, phase, sleepyTarget, stepProgress } from './progress';

describe('подъём мишки', () => {
  it('пока сервер спит, мишка не встаёт дальше края кровати', () => {
    expect(sleepyTarget(0)).toBe(0);
    expect(sleepyTarget(18)).toBeGreaterThan(0.5);
    expect(sleepyTarget(600)).toBeLessThanOrEqual(HOLD);
    let p = 0;
    for (let i = 0; i < 60 * 300; i++) p = stepProgress(p, 1 / 60, i / 60, false);
    expect(p).toBeLessThanOrEqual(HOLD);
    expect(p).toBeGreaterThan(HOLD - 0.01);
  });

  it('когда сервер ответил, мишка встаёт до конца за пару секунд', () => {
    let p = 0.3;
    for (let i = 0; i < 60; i++) p = stepProgress(p, 1 / 60, 5, true);
    expect(p).toBeLessThan(1);
    for (let i = 0; i < 60 * 2.5; i++) p = stepProgress(p, 1 / 60, 5, true);
    expect(p).toBe(1);
  });

  it('phase сглажена и ограничена отрезком', () => {
    expect(phase(0.1, 0.2, 0.4)).toBe(0);
    expect(phase(0.3, 0.2, 0.4)).toBeCloseTo(0.5);
    expect(phase(0.9, 0.2, 0.4)).toBe(1);
  });

  it('подсказки сменяются по времени', () => {
    const steps = [0, 10, 24, 42];
    expect(hintIndex(0, steps)).toBe(0);
    expect(hintIndex(12, steps)).toBe(1);
    expect(hintIndex(100, steps)).toBe(3);
  });
});
