import { describe, expect, it } from 'vitest';
import { angleOf, formatTime, handAngles, hourFromAngle, LEVELS, minuteFromAngle, minutesFor, readOptions, sameTime, stepOf, toDial } from '../src/game/clock';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe('углы стрелок', () => {
  it('3:00 — часовая на трёх, минутная наверху', () => {
    expect(handAngles({ h: 3, m: 0 })).toEqual({ hour: 90, minute: 0 });
  });

  it('8:30 — часовая между 8 и 9', () => {
    expect(handAngles({ h: 8, m: 30 })).toEqual({ hour: 255, minute: 180 });
  });

  it('12 часов — оба угла ноль', () => {
    expect(handAngles({ h: 12, m: 0 })).toEqual({ hour: 0, minute: 0 });
  });
});

describe('стрелки под пальцем', () => {
  it('минутная защёлкивается на ближайшем делении своего шага', () => {
    expect(minuteFromAngle(170, 30)).toBe(30);
    expect(minuteFromAngle(80, 15)).toBe(15);
    expect(minuteFromAngle(355, 5)).toBe(0);
    expect(minuteFromAngle(200, 60)).toBe(0);
    expect(minuteFromAngle(-90, 15)).toBe(45);
  });

  it('часовая учитывает сдвиг от минут, 0 превращается в 12', () => {
    expect(hourFromAngle(255, 30)).toBe(8);
    expect(hourFromAngle(5, 0)).toBe(12);
    expect(hourFromAngle(92, 0)).toBe(3);
  });

  it('угол из углов стрелок возвращает то же время на всех делениях', () => {
    for (const level of LEVELS)
      for (let h = 1; h <= 12; h++)
        for (const m of minutesFor(level)) {
          const a = handAngles({ h, m });
          expect(minuteFromAngle(a.minute, stepOf(level))).toBe(m);
          expect(hourFromAngle(a.hour, m)).toBe(h);
        }
  });

  it('угол точки: вверх 0, вправо 90, вниз 180, влево 270', () => {
    expect(angleOf(0, -10, 0, 0)).toBe(0);
    expect(angleOf(10, 0, 0, 0)).toBe(90);
    expect(angleOf(0, 10, 0, 0)).toBe(180);
    expect(angleOf(-10, 0, 0, 0)).toBe(270);
  });
});

describe('запись времени', () => {
  it('минуты двумя цифрами', () => {
    expect(formatTime({ h: 8, m: 5 })).toBe('8:05');
    expect(formatTime({ h: 12, m: 30 })).toBe('12:30');
  });

  it('24 часа → циферблат', () => {
    expect(toDial(13, 15)).toEqual({ h: 1, m: 15 });
    expect(toDial(12, 0)).toEqual({ h: 12, m: 0 });
    expect(toDial(0, 0)).toEqual({ h: 12, m: 0 });
  });
});

describe('минуты уровня', () => {
  it('у каждого уровня свой шаг, новые деления встречаются чаще', () => {
    expect(new Set(minutesFor(0))).toEqual(new Set([0]));
    expect(new Set(minutesFor(1))).toEqual(new Set([0, 30]));
    expect(minutesFor(1).filter((m) => m === 30).length).toBeGreaterThan(minutesFor(1).filter((m) => m === 0).length);
    expect(new Set(minutesFor(3)).size).toBe(12);
  });
});

describe('варианты ответа', () => {
  it('три разных варианта, ровно один верный, все на делениях уровня', () => {
    for (const level of LEVELS)
      for (let s = 1; s < 60; s++) {
        const rng = seeded(s);
        const target = { h: 1 + (s % 12), m: minutesFor(level)[s % minutesFor(level).length] };
        const opts = readOptions(target, level, rng);
        expect(opts).toHaveLength(3);
        expect(opts.filter((o) => sameTime(o, target))).toHaveLength(1);
        expect(new Set(opts.map(formatTime)).size).toBe(3);
        for (const o of opts) {
          expect(o.h).toBeGreaterThanOrEqual(1);
          expect(o.h).toBeLessThanOrEqual(12);
          expect(o.m % stepOf(level)).toBe(0);
        }
      }
  });
});
