import { describe, expect, it } from 'vitest';
import { bannerText, NO_FLAGS, parseFlags } from './flags';

describe('флаги сайта', () => {
  it('разбирает ответ /api/site', () => {
    expect(parseFlags({ maintenance: true, banner: { ru: ' Привет ', en: 'Hi', xx: 'no' }, disabledGames: ['drawing', 5] })).toEqual({
      maintenance: true,
      banner: { ru: 'Привет', en: 'Hi' },
      disabledGames: ['drawing'],
    });
  });

  it('непонятный ответ не закрывает сайт', () => {
    expect(parseFlags(null)).toEqual(NO_FLAGS);
    expect(parseFlags('down')).toEqual(NO_FLAGS);
    expect(parseFlags({ maintenance: 'yes', banner: 'x', disabledGames: 'drawing' })).toEqual(NO_FLAGS);
  });

  it('объявление на языке сайта, иначе на любом заполненном', () => {
    expect(bannerText({ ru: 'Привет', ro: 'Salut' }, 'ro')).toBe('Salut');
    expect(bannerText({ en: 'Hi' }, 'uk')).toBe('Hi');
    expect(bannerText({}, 'ru')).toBeNull();
  });
});
