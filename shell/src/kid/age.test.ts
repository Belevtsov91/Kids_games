import { describe, expect, it } from 'vitest';
import { kidAge } from './age';

describe('kidAge', () => {
  const now = new Date('2026-11-15T12:00:00Z');

  it('без месяца рождения берёт возраст профиля', () => {
    expect(kidAge({ age: 7, birthMonth: null }, now)).toBe(7);
  });

  it('считает полные годы по месяцу рождения', () => {
    expect(kidAge({ age: 7, birthMonth: '2018-11' }, now)).toBe(8);
    expect(kidAge({ age: 7, birthMonth: '2018-12' }, now)).toBe(7);
  });

  it('держит возраст в пределах 3–15', () => {
    expect(kidAge({ age: 3, birthMonth: '2025-01' }, now)).toBe(3);
    expect(kidAge({ age: 15, birthMonth: '2000-01' }, now)).toBe(15);
  });
});
