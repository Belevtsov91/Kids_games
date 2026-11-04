import { describe, expect, it } from 'vitest';
import { dayPart, decorOf, today } from './season';
import { familyText } from './text';
import { SKILLS } from '@ig/sdk';

describe('сезоны и мишка', () => {
  it('оформление по дате', () => {
    expect(decorOf(new Date(2026, 11, 25))).toBe('newyear');
    expect(decorOf(new Date(2027, 0, 5))).toBe('newyear');
    expect(decorOf(new Date(2027, 0, 20))).toBe('winter');
    expect(decorOf(new Date(2026, 3, 1))).toBe('spring');
    expect(decorOf(new Date(2026, 6, 1))).toBe('summer');
    expect(decorOf(new Date(2026, 10, 4))).toBe('autumn');
    expect(decorOf(new Date(2026, 11, 3))).toBe('winter');
  });

  it('время суток и дата дня', () => {
    expect(dayPart(new Date(2026, 0, 1, 8))).toBe('morning');
    expect(dayPart(new Date(2026, 0, 1, 14))).toBe('day');
    expect(dayPart(new Date(2026, 0, 1, 21))).toBe('evening');
    expect(today(new Date(2026, 2, 7))).toBe('2026-03-07');
  });

  it('задание дома есть для каждого навыка на всех языках', () => {
    for (const locale of ['ru', 'uk', 'ro', 'en'] as const) {
      for (const s of SKILLS) expect(familyText(locale).offline.tasks[s], `${locale}:${s}`).toBeTruthy();
    }
  });
});
