import { describe, expect, it } from 'vitest';
import { decode, encode, fitsAlphabet, mod, normalizeKey, shiftLetter } from '../src/game/caesar';
import { CYRILLIC, LATIN, UKRAINIAN, codeOf, fitsTable, flashesFor, letterOf, prettyCode } from '../src/game/morse';
import { PACKS } from '../src/packs';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

describe('шифр Цезаря', () => {
  it('сдвигает буквы по кругу', () => {
    expect(shiftLetter('A', 3, ABC)).toBe('D');
    expect(shiftLetter('Z', 1, ABC)).toBe('A');
    expect(shiftLetter('A', -1, ABC)).toBe('Z');
    expect(shiftLetter('-', 5, ABC)).toBe('-');
  });

  it('классический пример Цезаря', () => {
    expect(encode('HELLO', 3, ABC)).toBe('KHOOR');
    expect(decode('KHOOR', 3, ABC)).toBe('HELLO');
  });

  it('расшифровка отменяет шифровку для любого ключа и любого языка', () => {
    for (const pack of Object.values(PACKS)) {
      for (const { word } of pack.words) {
        for (let key = -40; key <= 40; key += 7) expect(decode(encode(word, key, pack.alphabet), key, pack.alphabet)).toBe(word);
      }
    }
  });

  it('работает с украинскими Ґ, Є, Ї', () => {
    const alphabet = PACKS.uk.alphabet;
    expect(shiftLetter('Г', 1, alphabet)).toBe('Ґ');
    expect(shiftLetter('Я', 1, alphabet)).toBe('А');
    expect(encode('КІТ', 1, alphabet)).toBe('ЛЇУ');
  });

  it('ключ нормализуется', () => {
    expect(mod(-1, 26)).toBe(25);
    expect(normalizeKey(29, ABC)).toBe(3);
    expect(normalizeKey(-3, ABC)).toBe(23);
  });

  it('загадка со сдвигом в каждом языке сходится с ответом', () => {
    expect(encode('КОТ', 1, PACKS.ru.alphabet)).toBe('ЛПУ');
    expect(encode('CAT', 1, PACKS.en.alphabet)).toBe('DBU');
    expect(encode('URS', 1, PACKS.ro.alphabet)).toBe('VST');
    expect(fitsAlphabet('КІТ', PACKS.ru.alphabet)).toBe(false);
  });
});

describe('азбука Морзе', () => {
  it('знает SOS', () => {
    expect(['S', 'O', 'S'].map((l) => codeOf(l, LATIN)).join(' ')).toBe('... --- ...');
    expect(['С', 'О', 'С'].map((l) => codeOf(l, CYRILLIC)).join(' ')).toBe('... --- ...');
  });

  it('коды в каждой таблице уникальны, поэтому обратный поиск однозначен', () => {
    for (const table of [LATIN, CYRILLIC, UKRAINIAN]) {
      const codes = Object.values(table);
      expect(new Set(codes).size).toBe(codes.length);
      for (const [letter, code] of Object.entries(table)) expect(letterOf(code, table)).toBe(letter);
    }
  });

  it('украинская таблица: И и І различаются, русских Ы Э Ъ нет', () => {
    expect(codeOf('И', UKRAINIAN)).toBe('-.--');
    expect(codeOf('І', UKRAINIAN)).toBe('..');
    expect(codeOf('Ы', UKRAINIAN)).toBeNull(); // i18n-ok
    expect(fitsTable('КІТ', UKRAINIAN)).toBe(true);
  });

  it('вспышки: точка 1 тик, тире 3, паузы между сигналами', () => {
    expect(flashesFor('.-')).toEqual([
      { on: true, ticks: 1 },
      { on: false, ticks: 1 },
      { on: true, ticks: 3 },
    ]);
    expect(prettyCode('.-')).toBe('•—');
  });
});
