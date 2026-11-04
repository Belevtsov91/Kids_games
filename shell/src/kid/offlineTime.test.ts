import { describe, expect, it } from 'vitest';
import type { KidStatus } from './KidStatus';
import { applyOffline, quietNow } from './offlineTime';

const base: KidStatus = {
  time: { day: '2026-11-04', limit: 30, usedMinutes: 25, remaining: 5, blocked: null, quietTo: null },
  rules: { limitWeekday: 30, limitWeekend: 45, quietFrom: '21:00', quietTo: '07:00', breakEvery: 0, canAsk: true },
  breakEvery: 0,
  canAsk: true,
  access: {},
  request: null,
};

describe('время без сети', () => {
  it('считает минуты сам и закрывает игру на нуле', () => {
    const noon = new Date(2026, 10, 4, 12, 0);
    expect(applyOffline(base, 120, noon).time.remaining).toBe(3);
    const done = applyOffline(base, 5 * 60, noon);
    expect(done.time.remaining).toBe(0);
    expect(done.time.blocked).toBe('limit');
  });

  it('тихие часы по часам устройства, через полночь', () => {
    expect(quietNow(base.rules, 22 * 60)).toBe(true);
    expect(quietNow(base.rules, 6 * 60)).toBe(true);
    expect(quietNow(base.rules, 12 * 60)).toBe(false);
    expect(applyOffline(base, 0, new Date(2026, 10, 4, 23, 0)).time.blocked).toBe('quiet');
  });

  it('без лимита время не кончается', () => {
    const free = { ...base, time: { ...base.time, limit: null, remaining: null }, rules: { ...base.rules, quietFrom: null, quietTo: null } };
    expect(applyOffline(free, 10_000).time.blocked).toBeNull();
  });
});
