import { describe, expect, it } from 'vitest';
import { forecast, output, parseMap, simulate, spent } from '../src/game/sim';
import { BATTERY_CAPACITY, COST, DAY_START, type Level } from '../src/game/types';

const level = (over: Partial<Level> = {}): Level => ({
  id: 99,
  key: 'test',
  map: ['h..', '^t~'],
  tools: ['solar', 'wind', 'battery'],
  sun: 1,
  wind: 'none',
  budget: 99,
  ...over,
});

describe('карта и выработка', () => {
  it('разбирает клетки', () => {
    const cells = parseMap(['h^', 't~']);
    expect(cells.map((c) => c.terrain)).toEqual(['grass', 'hill', 'grove', 'water']);
    expect(cells[0].house).toBe('house');
  });

  it('роща затеняет панель, холм усиливает ветряк', () => {
    const lv = { sun: 1, wind: 'steady' as const };
    expect(output('solar', 'grove', 12, lv)).toBe(output('solar', 'grass', 12, lv) / 2);
    expect(output('wind', 'hill', 3, lv)).toBe(output('wind', 'grass', 3, lv) * 1.5);
    expect(output('solar', 'grass', 0, lv)).toBe(0);
  });

  it('прогноз начинается с рассвета', () => {
    expect(forecast(level(), {})[0].clock).toBe(DAY_START);
  });

  it('считает цену построек', () => {
    expect(spent({ 1: 'solar', 2: 'battery', 3: 'wind' }, COST)).toBe(COST.solar + COST.battery + COST.wind);
  });
});

describe('сутки', () => {
  it('без построек ночью темно', () => {
    const day = simulate(level(), {});
    expect(day.ok).toBe(false);
    expect(day.blackouts).toBe(24);
  });

  it('одна панель без батареи не спасает ночь', () => {
    const day = simulate(level(), { 1: 'solar' });
    const night = day.hours.find((h) => h.clock === 22)!;
    expect(night.missing).toBeGreaterThan(0);
    const noon = day.hours.find((h) => h.clock === 12)!;
    expect(noon.missing).toBe(0);
    expect(noon.wasted).toBeGreaterThan(0);
  });

  it('панели и батареи держат свет круглые сутки, заряд не выходит за ёмкость', () => {
    const day = simulate(level({ map: ['h....'] }), { 1: 'solar', 2: 'solar', 3: 'battery', 4: 'battery' });
    expect(day.ok).toBe(true);
    expect(day.capacity).toBe(2 * BATTERY_CAPACITY);
    for (const h of day.hours) {
      expect(h.charge).toBeGreaterThanOrEqual(0);
      expect(h.charge).toBeLessThanOrEqual(day.capacity);
    }
  });

  it('утренний заряд равен вечернему: сутки замкнуты', () => {
    const day = simulate(level({ map: ['h....'] }), { 1: 'solar', 2: 'solar', 3: 'battery', 4: 'battery' });
    const last = day.hours[day.hours.length - 1];
    const first = day.hours[0];
    const startCharge = first.charge - (first.solar + first.wind - first.demand);
    expect(startCharge).toBeCloseTo(last.charge, 5);
  });
});
