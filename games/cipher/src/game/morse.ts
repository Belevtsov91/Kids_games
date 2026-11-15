// Азбука Морзе. Точка — короткая вспышка маяка, тире — длинная.
// Латиница — международная таблица, кириллица — русская, у украинского свои буквы.

export type MorseTable = Readonly<Record<string, string>>;

export const LATIN: MorseTable = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
};

export const CYRILLIC: MorseTable = {
  А: '.-', Б: '-...', В: '.--', Г: '--.', Д: '-..', Е: '.', Ж: '...-', З: '--..', И: '..', Й: '.---',
  К: '-.-', Л: '.-..', М: '--', Н: '-.', О: '---', П: '.--.', Р: '.-.', С: '...', Т: '-', У: '..-',
  Ф: '..-.', Х: '....', Ц: '-.-.', Ч: '---.', Ш: '----', Щ: '--.-', Ъ: '--.--', Ы: '-.--', Ь: '-..-',
  Э: '..-..', Ю: '..--', Я: '.-.-',
};

/** Украинская таблица: И звучит как русская Ы, І — как русская И, плюс Є, Ї, Ґ. */
export const UKRAINIAN: MorseTable = {
  ...Object.fromEntries(Object.entries(CYRILLIC).filter(([letter]) => !'ЫЭЪ'.includes(letter))), // i18n-ok
  И: '-.--', І: '..', Є: '..-..', Ї: '.---.', Ґ: '--.-.',
};

/** Код буквы или null, если буквы нет в таблице. */
export const codeOf = (letter: string, table: MorseTable): string | null => table[letter] ?? null;

/** Можно ли передать слово этой таблицей целиком. */
export const fitsTable = (word: string, table: MorseTable) => Array.from(word).every((letter) => letter in table);

/** Буква по коду (обратный поиск); null, если такого кода нет. */
export function letterOf(code: string, table: MorseTable): string | null {
  for (const [letter, value] of Object.entries(table)) if (value === code) return letter;
  return null;
}

/** Длительность сигналов в «тиках»: точка 1, тире 3, пауза внутри буквы 1. */
export interface Flash {
  on: boolean;
  ticks: number;
}

/** Расписание вспышек маяка для одной буквы. */
export function flashesFor(code: string): Flash[] {
  const flashes: Flash[] = [];
  Array.from(code).forEach((signal, i) => {
    if (i > 0) flashes.push({ on: false, ticks: 1 });
    flashes.push({ on: true, ticks: signal === '-' ? 3 : 1 });
  });
  return flashes;
}

/** Код для показа: точки и тире крупными символами. */
export const prettyCode = (code: string) => code.replaceAll('.', '•').replaceAll('-', '—');
