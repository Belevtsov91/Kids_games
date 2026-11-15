import { describe, expect, it } from 'vitest';
import { GIFT_ICONS, giftIndex, minutesLeft } from './quest';

describe('задание дня на дашборде', () => {
  it('минуты до выполнения считаются вверх', () => {
    expect(minutesLeft({ seconds: 0, need: 180, done: false })).toBe(3);
    expect(minutesLeft({ seconds: 170, need: 180, done: false })).toBe(1);
    expect(minutesLeft({ seconds: 180, need: 180, done: true })).toBe(0);
  });

  it('подарки идут по кругу', () => {
    expect(giftIndex(0)).toBe(0);
    expect(giftIndex(GIFT_ICONS.length)).toBe(0);
    expect(giftIndex(GIFT_ICONS.length + 2)).toBe(2);
  });
});
