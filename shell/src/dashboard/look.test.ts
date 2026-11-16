import { describe, expect, it } from 'vitest';
import { defaultLook, parseLook } from './look';

describe('вид дашборда', () => {
  it('до 10 лет ярко, с 10 спокойно; Тёпа по умолчанию на месте', () => {
    expect(defaultLook(6)).toEqual({ look: 'bright', mascot: true });
    expect(defaultLook(9)).toEqual({ look: 'bright', mascot: true });
    expect(defaultLook(10)).toEqual({ look: 'calm', mascot: true });
    expect(defaultLook(undefined).look).toBe('bright');
  });

  it('сохранённый выбор важнее возраста', () => {
    expect(parseLook('{"look":"bright","mascot":false}', 13)).toEqual({ look: 'bright', mascot: false });
    expect(parseLook('{"look":"calm"}', 5)).toEqual({ look: 'calm', mascot: true });
  });

  it('мусор в хранилище — по умолчанию', () => {
    expect(parseLook('не json', 12)).toEqual({ look: 'calm', mascot: true });
    expect(parseLook('{"look":"neon","mascot":"yes"}', 4)).toEqual({ look: 'bright', mascot: true });
    expect(parseLook(null, 11).look).toBe('calm');
  });
});
