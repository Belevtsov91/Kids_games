import { describe, expect, it } from 'vitest';
import { defaultRules, inactiveStep, needsPassword, shouldAskWho, switchReason } from '../src/modules/children/profileRules';
import { dayLimit, kidTime, NO_RULES } from '../src/modules/kid/timeRules';
import { helperSees } from '../src/modules/notify/notify';

const free = { blocked: null, hasRules: false, exitLock: false } as const;

describe('смена и создание профиля', () => {
  it('первый профиль создаётся свободно, следующие — только со взрослым', () => {
    expect(switchReason({ leaving: null, target: 'new', childCount: 0 })).toBeNull();
    expect(switchReason({ leaving: null, target: 'new', childCount: 1 })).toBe('create');
    expect(switchReason({ leaving: free, target: 'new', childCount: 3 })).toBe('create');
  });

  it('в защищённый профиль без взрослого не войти, даже когда профиль ещё не выбран', () => {
    expect(switchReason({ leaving: null, target: { locked: true }, childCount: 2 })).toBe('locked');
    expect(switchReason({ leaving: free, target: { locked: true }, childCount: 2 })).toBe('locked');
    expect(switchReason({ leaving: free, target: { locked: false }, childCount: 2 })).toBeNull();
  });

  it('из профиля с правилами или замком на выход без взрослого не уйти', () => {
    expect(switchReason({ leaving: { ...free, hasRules: true }, target: { locked: false }, childCount: 2 })).toBe('rules');
    expect(switchReason({ leaving: { ...free, exitLock: true }, target: { locked: false }, childCount: 2 })).toBe('exit');
    expect(switchReason({ leaving: { blocked: 'limit', hasRules: true, exitLock: true }, target: 'new', childCount: 2 })).toBe('limit');
    expect(switchReason({ leaving: { blocked: 'quiet', hasRules: true, exitLock: false }, target: { locked: true }, childCount: 2 })).toBe('quiet');
  });
});

describe('правила нового профиля по возрасту', () => {
  it('у малышей лимит меньше и тихие часы раньше', () => {
    expect(defaultRules(4)).toMatchObject({ limit_weekday: 40, limit_weekend: 60, quiet_from: '20:00' });
    expect(defaultRules(7)).toMatchObject({ limit_weekday: 60, quiet_from: '21:00' });
    expect(defaultRules(14).limit_weekday).toBeGreaterThan(defaultRules(10).limit_weekday);
  });

  it('значения проходят ограничения таблицы', () => {
    for (let age = 3; age <= 15; age++) {
      const r = defaultRules(age);
      for (const m of [r.limit_weekday, r.limit_weekend]) expect(m >= 5 && m <= 600).toBe(true);
      expect(r.break_every >= 0 && r.break_every <= 120).toBe(true);
      expect(r.quiet_from).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
    }
  });
});

describe('«кто играет?» после перерыва', () => {
  const now = new Date('2026-11-13T18:00:00Z');
  const ago = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();

  it('спрашиваем после 4 часов без игры, если детей несколько', () => {
    expect(shouldAskWho({ childCount: 2, exitLock: false, seenAt: [ago(5), ago(6)], now })).toBe(true);
    expect(shouldAskWho({ childCount: 2, exitLock: false, seenAt: [ago(5), ago(1)], now })).toBe(false);
    expect(shouldAskWho({ childCount: 2, exitLock: false, seenAt: [null, undefined], now })).toBe(true);
  });

  it('один ребёнок или личное устройство — не спрашиваем', () => {
    expect(shouldAskWho({ childCount: 1, exitLock: false, seenAt: [ago(50)], now })).toBe(false);
    expect(shouldAskWho({ childCount: 3, exitLock: true, seenAt: [ago(50)], now })).toBe(false);
  });
});

describe('PIN и пароль', () => {
  it('без PIN при ребёнке от 7 лет нужен пароль аккаунта', () => {
    expect(needsPassword(false, [4, 6])).toBe(false);
    expect(needsPassword(false, [4, 7])).toBe(true);
    expect(needsPassword(true, [12])).toBe(false);
    expect(needsPassword(false, [])).toBe(false);
  });
});

describe('лимит на каждый день недели', () => {
  const rules = { ...NO_RULES, limitWeekday: 45, limitWeekend: 90 };
  // воскресенье … суббота; 0 — без лимита
  const days = [120, 30, 30, 30, 30, 60, 0];

  it('без своих дней работают будни и выходные', () => {
    expect(dayLimit(rules, 1)).toBe(45);
    expect(dayLimit(rules, 0)).toBe(90);
  });

  it('свои дни важнее, 0 — день без лимита', () => {
    const own = { ...rules, limitDays: days };
    expect(dayLimit(own, 1)).toBe(30);
    expect(dayLimit(own, 5)).toBe(60);
    expect(dayLimit(own, 0)).toBe(120);
    expect(dayLimit(own, 6)).toBeNull();
    expect(kidTime(own, 30 * 60, 0, { day: '2026-11-02', weekday: 1, minutes: 600 })).toMatchObject({ limit: 30, blocked: 'limit' });
    expect(kidTime(own, 500 * 60, 0, { day: '2026-11-07', weekday: 6, minutes: 600 })).toMatchObject({ limit: null, blocked: null });
  });

  it('неполный список не считается', () => {
    expect(dayLimit({ ...rules, limitDays: [10, 10] }, 1)).toBe(45);
  });
});

describe('срок хранения неактивных аккаунтов', () => {
  const now = new Date('2028-12-01T00:00:00Z');
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();

  it('сначала письмо, удаление только через 30 дней после него', () => {
    expect(inactiveStep(daysAgo(100), null, now)).toBe('none');
    expect(inactiveStep(daysAgo(705), null, now)).toBe('warn');
    expect(inactiveStep(daysAgo(900), null, now)).toBe('warn');
    expect(inactiveStep(daysAgo(900), daysAgo(10), now)).toBe('none');
    expect(inactiveStep(daysAgo(900), daysAgo(31), now)).toBe('delete');
  });

  it('старое предупреждение до последнего входа не считается', () => {
    expect(inactiveStep(daysAgo(800), daysAgo(1200), now)).toBe('warn');
  });
});

describe('помощник семьи для выбранных детей', () => {
  it('без списка видит всех, со списком — только своих', () => {
    expect(helperSees(null, 'a')).toBe(true);
    expect(helperSees([], 'a')).toBe(true);
    expect(helperSees(['a'], 'a')).toBe(true);
    expect(helperSees(['b'], 'a')).toBe(false);
  });
});
