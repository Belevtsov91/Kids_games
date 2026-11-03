import { describe, expect, it } from 'vitest';
import { circleScale, PACES, startBreath, tick, type BreathEvent, type BreathState, type Mode } from '../src/game/breath';
import { emptyProgress, finishSession, readProgress, unlockedColors } from '../src/game/progress';

const pace = PACES.easy;
const run = (s: BreathState, ms: number, holding: boolean, mode: Mode = 'hold') => {
  const events: BreathEvent[] = [];
  for (let i = 0; i < ms / 100; i++) {
    const r = tick(s, 100, holding, mode, pace);
    s = r.state;
    events.push(...r.events);
  }
  return { s, events };
};

describe('дыхание', () => {
  it('удержание → вдох, отпустил → выдох, затем пауза', () => {
    let r = run(startBreath(2), 3000, true);
    expect(r.s.phase).toBe('inhale');
    expect(r.events).toContain('inhale-start');
    r = run(r.s, 100, false);
    expect(r.s.phase).toBe('exhale');
    r = run(r.s, 3500, false);
    expect(r.s).toMatchObject({ phase: 'rest', breaths: 1 });
  });
  it('слишком короткий вдох — заново и без наказания', () => {
    let r = run(startBreath(2), 500, true);
    r = run(r.s, 100, false);
    expect(r.events).toContain('too-short');
    expect(r.s).toMatchObject({ phase: 'ready', breaths: 0 });
  });
  it('режим «за кругом» дышит сам до цели', () => {
    const r = run(startBreath(2), 20000, false, 'follow');
    expect(r.s.phase).toBe('done');
    expect(r.events.filter((e) => e === 'breath-done')).toHaveLength(2);
    expect(r.events).toContain('all-done');
  });
  it('круг растёт на вдохе и сдувается на выдохе', () => {
    expect(circleScale({ phase: 'inhale', t: 1, breaths: 0, goal: 1 })).toBe(1);
    expect(circleScale({ phase: 'exhale', t: 1, breaths: 0, goal: 1 })).toBeCloseTo(0.6);
  });
});

describe('прогресс', () => {
  it('новый цвет каждые три минутки', () => {
    let p = emptyProgress();
    const flags: boolean[] = [];
    for (let i = 0; i < 3; i++) {
      const r = finishSession(p);
      p = r.progress;
      flags.push(r.newColor);
    }
    expect(flags).toEqual([false, false, true]);
    expect(unlockedColors(p)).toBe(2);
    expect(readProgress({ sessions: 3, color: 5 })).toEqual({ sessions: 3, color: 0 });
    expect(readProgress({ sessions: 3, color: 1 }).color).toBe(1);
  });
});
