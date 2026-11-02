// Слова с картинками и уровни. Только заглавные буквы, без Ё, чтобы не путать детей с Е.

export interface Word {
  word: string;
  emoji: string;
}

export interface Level {
  id: number;
  title: string;
  emoji: string;
  /** Сколько слов собрать за уровень. */
  rounds: number;
  /** Сколько лишних букв летает рядом с нужными. */
  distractors: number;
  /** Лишние буквы похожи на нужные (Б/В, Ш/Щ…). */
  similar: boolean;
  /** В клетках слова видны бледные подсказки-буквы. */
  ghostLetters: boolean;
  /** Озвучивать слово в начале раунда. */
  speakAtStart: boolean;
  words: Word[];
}

export const ALPHABET = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

/** Буквы, которые дети часто путают: лишние буквы на сложных уровнях берутся отсюда. */
export const SIMILAR: Record<string, string> = {
  А: 'ДЯЛ', Б: 'ВЬЪР', В: 'БЗР', Г: 'ТПР', Д: 'ЛАБ', Е: 'ЭЗИ', Ж: 'ХКШ', З: 'ЭВЕ', И: 'ЙНШ', Й: 'ИН',
  К: 'ЖХН', Л: 'ДМП', М: 'ЛНШ', Н: 'ИПМ', О: 'СЭЮ', П: 'НЛГ', Р: 'ВБЯ', С: 'ОЭЕ', Т: 'ГШП', У: 'ЧЦ',
  Ф: 'ОР', Х: 'ЖК', Ц: 'ЩУ', Ч: 'УЬ', Ш: 'ЩИМ', Щ: 'ШЦ', Ъ: 'ЬБ', Ы: 'ЬБ', Ь: 'ЪЫБ', Э: 'ЕЗС',
  Ю: 'ОИ', Я: 'РА',
};

export const LEVELS: Level[] = [
  {
    id: 1, title: 'Первые слова', emoji: '🌱', rounds: 5, distractors: 3, similar: false, ghostLetters: true, speakAtStart: true,
    words: [
      { word: 'КОТ', emoji: '🐱' }, { word: 'ДОМ', emoji: '🏠' }, { word: 'СЫР', emoji: '🧀' }, { word: 'КИТ', emoji: '🐳' },
      { word: 'ЖУК', emoji: '🪲' }, { word: 'РАК', emoji: '🦞' }, { word: 'ЛУК', emoji: '🧅' }, { word: 'МЯЧ', emoji: '⚽' },
      { word: 'ЛЕВ', emoji: '🦁' }, { word: 'НОС', emoji: '👃' }, { word: 'ЗУБ', emoji: '🦷' }, { word: 'СУП', emoji: '🍲' },
      { word: 'СОК', emoji: '🧃' }, { word: 'ЛЕС', emoji: '🌲' },
    ],
  },
  {
    id: 2, title: 'Четыре буквы', emoji: '🌼', rounds: 5, distractors: 4, similar: false, ghostLetters: true, speakAtStart: true,
    words: [
      { word: 'ЛУНА', emoji: '🌙' }, { word: 'РЫБА', emoji: '🐟' }, { word: 'СОВА', emoji: '🦉' }, { word: 'ЗОНТ', emoji: '☂️' },
      { word: 'ТОРТ', emoji: '🎂' }, { word: 'КОЗА', emoji: '🐐' }, { word: 'ГРИБ', emoji: '🍄' }, { word: 'ЛИСА', emoji: '🦊' },
      { word: 'УТКА', emoji: '🦆' }, { word: 'МЫШЬ', emoji: '🐭' }, { word: 'ВОЛК', emoji: '🐺' }, { word: 'РОЗА', emoji: '🌹' },
      { word: 'СЛОН', emoji: '🐘' }, { word: 'ФЛАГ', emoji: '🚩' }, { word: 'ЧАСЫ', emoji: '⌚' },
    ],
  },
  {
    id: 3, title: 'Слова посложнее', emoji: '🌳', rounds: 6, distractors: 5, similar: false, ghostLetters: false, speakAtStart: true,
    words: [
      { word: 'ЖИРАФ', emoji: '🦒' }, { word: 'ЗЕБРА', emoji: '🦓' }, { word: 'КОАЛА', emoji: '🐨' }, { word: 'ПАНДА', emoji: '🐼' },
      { word: 'ПОЕЗД', emoji: '🚂' }, { word: 'ЛИМОН', emoji: '🍋' }, { word: 'ГРУША', emoji: '🍐' }, { word: 'ТЫКВА', emoji: '🎃' },
      { word: 'КНИГА', emoji: '📚' }, { word: 'ЗАМОК', emoji: '🏰' }, { word: 'ПЧЕЛА', emoji: '🐝' }, { word: 'БАНАН', emoji: '🍌' },
      { word: 'ЗАЯЦ', emoji: '🐰' }, { word: 'ТИГР', emoji: '🐯' },
    ],
  },
  {
    id: 4, title: 'Длинные слова', emoji: '🚀', rounds: 6, distractors: 5, similar: true, ghostLetters: false, speakAtStart: false,
    words: [
      { word: 'ЯБЛОКО', emoji: '🍎' }, { word: 'РАКЕТА', emoji: '🚀' }, { word: 'ЦВЕТОК', emoji: '🌷' }, { word: 'ОБЛАКО', emoji: '☁️' },
      { word: 'МАШИНА', emoji: '🚗' }, { word: 'ПИНГВИН', emoji: '🐧' }, { word: 'МОРКОВЬ', emoji: '🥕' }, { word: 'АВТОБУС', emoji: '🚌' },
      { word: 'ДЕЛЬФИН', emoji: '🐬' }, { word: 'БАБОЧКА', emoji: '🦋' }, { word: 'ПОДАРОК', emoji: '🎁' }, { word: 'ВЕРБЛЮД', emoji: '🐫' },
    ],
  },
  {
    id: 5, title: 'Чемпион', emoji: '🏆', rounds: 6, distractors: 6, similar: true, ghostLetters: false, speakAtStart: false,
    words: [
      { word: 'ЧЕРЕПАХА', emoji: '🐢' }, { word: 'КЛУБНИКА', emoji: '🍓' }, { word: 'ВИНОГРАД', emoji: '🍇' }, { word: 'ОСЬМИНОГ', emoji: '🐙' },
      { word: 'СНЕГОВИК', emoji: '⛄' }, { word: 'КРОКОДИЛ', emoji: '🐊' }, { word: 'ВЕЛОСИПЕД', emoji: '🚲' }, { word: 'КОРАБЛИК', emoji: '⛵' },
      { word: 'ПОДСОЛНУХ', emoji: '🌻' }, { word: 'КУКУРУЗА', emoji: '🌽' }, { word: 'МОРОЖЕНОЕ', emoji: '🍦' }, { word: 'ДИНОЗАВР', emoji: '🦕' },
    ],
  },
];

/** Как буква называется вслух: голос браузера читает одиночные буквы по-разному, поэтому подсказываем. */
export const LETTER_NAMES: Record<string, string> = {
  А: 'а', Б: 'бэ', В: 'вэ', Г: 'гэ', Д: 'дэ', Е: 'е', Ж: 'жэ', З: 'зэ', И: 'и', Й: 'и краткое', К: 'ка', Л: 'эль',
  М: 'эм', Н: 'эн', О: 'о', П: 'пэ', Р: 'эр', С: 'эс', Т: 'тэ', У: 'у', Ф: 'эф', Х: 'ха', Ц: 'цэ', Ч: 'чэ',
  Ш: 'ша', Щ: 'ща', Ъ: 'твёрдый знак', Ы: 'ы', Ь: 'мягкий знак', Э: 'э', Ю: 'ю', Я: 'я',
};
