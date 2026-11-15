import { describe, expect, it } from 'vitest';
import manifest from '../manifest';
import { stepOf, type Level } from '../src/game/clock';
import { dayPartOf, hurryPlan, nextUnlocked, planDay, ROUTINE, stickersFor, TASKS_PER_DAY } from '../src/game/day';
import { merge } from '../src/game/saveData';

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const order = ROUTINE.map((e) => e.id as string);

describe('план дня', () => {
  it('день начинается подъёмом, кончается сном, дела идут по порядку и чередуются задания', () => {
    for (let s = 1; s < 40; s++) {
      const plan = planDay((s % 4) as Level, seeded(s));
      expect(plan).toHaveLength(TASKS_PER_DAY);
      expect(plan[0].event).toBe('wake');
      expect(plan.at(-1)!.event).toBe('sleep');
      const idx = plan.map((t) => order.indexOf(t.event));
      expect([...idx].sort((a, b) => a - b)).toEqual(idx);
      expect(new Set(idx).size).toBe(idx.length);
      plan.forEach((t, i) => expect(t.kind).toBe(i % 2 ? 'set' : 'read'));
    }
  });

  it('время дела совпадает с его часами и делениями уровня', () => {
    for (let s = 1; s < 40; s++) {
      const level = (s % 4) as Level;
      for (const t of planDay(level, seeded(s))) {
        const hours = ROUTINE.find((e) => e.id === t.event)!.hours as readonly number[];
        expect(hours).toContain(t.hour24);
        expect(t.time.h).toBe(t.hour24 % 12 || 12);
        expect(t.time.m % stepOf(level)).toBe(0);
      }
    }
  });

  it('время суток', () => {
    expect(dayPartOf(7)).toBe('morning');
    expect(dayPartOf(13)).toBe('day');
    expect(dayPartOf(19)).toBe('evening');
    expect(dayPartOf(21)).toBe('night');
  });

  it('время кончается — после текущего задания сразу сон', () => {
    const plan = planDay(0, seeded(5));
    const short = hurryPlan(plan, 1);
    expect(short.map((t) => t.event)).toEqual([plan[0].event, plan[1].event, 'sleep']);
    expect(hurryPlan(plan, plan.length - 1)).toBe(plan);
  });
});

describe('уровни и наклейки', () => {
  it('новый уровень открывается за день почти без ошибок на последнем открытом', () => {
    expect(nextUnlocked(0, 0, 0)).toBe(1);
    expect(nextUnlocked(0, 0, 5)).toBe(0);
    expect(nextUnlocked(2, 1, 0)).toBe(2);
    expect(nextUnlocked(3, 3, 0)).toBe(3);
  });

  it('наклейки дня, все есть в манифесте', () => {
    const ids = new Set(manifest.stickers?.map((s) => s.id));
    expect(stickersFor(0, 0, 0)).toEqual(['first-day', 'hours', 'no-mistakes']);
    expect(stickersFor(6, 3, 2)).toEqual(['five-minutes', 'seven-days']);
    for (let d = 0; d < 9; d++) for (const l of [0, 1, 2, 3] as Level[]) for (const id of stickersFor(d, l, d % 2)) expect(ids.has(id)).toBe(true);
  });
});

describe('сохранение', () => {
  it('берёт больше дней и больший уровень, мусор отбрасывает', () => {
    expect(merge({ days: 3, unlocked: 1 }, { days: 5, unlocked: 0 })).toEqual({ days: 5, unlocked: 1 });
    expect(merge(null, { days: -1, unlocked: 0 }, { days: 2, unlocked: 9 })).toEqual({ days: 0, unlocked: 0 });
  });
});
