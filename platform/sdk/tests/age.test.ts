import { describe, expect, it } from 'vitest';
import { ageOf, byAge } from '../src';

describe('ageOf', () => {
  it('берёт возраст из профиля', () => {
    expect(ageOf({ age: 6 })).toBe(6);
  });
  it('без профиля или возраста — null', () => {
    expect(ageOf(null)).toBeNull();
    expect(ageOf({})).toBeNull();
    expect(ageOf({ age: null })).toBeNull();
    expect(ageOf({ age: 0 })).toBeNull();
  });
});

describe('byAge', () => {
  const steps = [[3, 'a'], [5, 'b'], [7, 'c']] as const;
  it('выбирает последнюю достигнутую ступень', () => {
    expect(byAge(4, steps, 'x')).toBe('a');
    expect(byAge(5, steps, 'x')).toBe('b');
    expect(byAge(12, steps, 'x')).toBe('c');
  });
  it('младше первой ступени или без возраста — fallback', () => {
    expect(byAge(2, steps, 'x')).toBe('x');
    expect(byAge(null, steps, 'x')).toBe('x');
  });
});
