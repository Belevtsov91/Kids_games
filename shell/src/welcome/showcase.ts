/** Витрина стартовой страницы: какие игры показываем островами и игрушками в 3D-сцене. */

export interface ShowcaseGame {
  id: string;
  title: string;
  /** Короткое имя для подписи над островом. */
  short?: string;
  icon: string;
  kind: '2D' | '3D';
  ages: string;
  /** Цвет подписи, иконки и подсветки. */
  color: string;
  text: string;
  /** Одна строка для карточки на полке. */
  card?: string;
  tags: string[];
  /** Настоящие кадры из игры (из public/). */
  shots?: { src: string; alt: string }[];
}

/** Большие острова-диорамы, по часовой стрелке. */
export const BIG_IDS = ['moon-valley', 'island-builder', 'playground3d', 'space-gardener'] as const;
/** Маленькие игрушки вокруг островов. */
export const SMALL_IDS = ['drawing', 'puzzles', 'letter-eater', 'animal-orchestra', 'counting', 'who-lives-where'] as const;

export type BigId = (typeof BIG_IDS)[number];
export type SmallId = (typeof SMALL_IDS)[number];
export type ShowcaseId = BigId | SmallId;

export const SHOWCASE: Record<ShowcaseId, ShowcaseGame> = {
  'moon-valley': {
    id: 'moon-valley', title: 'Хранители Лунной Долины', short: 'Лунная Долина', icon: '🌙', kind: '3D', ages: '7–15 лет', color: '#a99bff',
    text: 'Большое 3D-приключение. Деревня, грядки и теплица, квесты в журнале, Грибной король на северной поляне и лиса Луна, которую можно погладить. Есть день и ночь.',
    card: '3D-приключение с квестами, питомцем и сменой дня и ночи.',
    tags: ['Квесты', 'Питомец', 'День и ночь'],
    shots: [
      { src: '/welcome/moon-valley-village.jpg', alt: 'Деревня в Лунной Долине' },
      { src: '/welcome/moon-valley-night.jpg', alt: 'Лунная Долина ночью' },
    ],
  },
  'island-builder': {
    id: 'island-builder', title: 'Остров-конструктор', icon: '🏝️', kind: '3D', ages: '10–15 лет', color: '#7ee7ff',
    text: 'Строй остров из блоков: копай бухту, сажай деревья, ставь фонари, спускай лодки на воду. Задания вроде «Построй башню высотой 11».',
    card: 'Блоки, деревья, лодки и фонари. Свой остров с заданиями.',
    tags: ['Блоки', 'Лодки', 'Задания'],
  },
  playground3d: {
    id: 'playground3d', title: '3D песочница', icon: '🧊', kind: '3D', ages: '5–15 лет', color: '#ffd25a',
    text: 'Игрушки с настоящей физикой: пирамидки, кубики и мячи. Бросай, строй и роняй сколько хочется.',
    card: 'Пирамидки, кубики и мячи с настоящей физикой.',
    tags: ['Физика', 'Игрушки', 'Без правил'],
  },
  'space-gardener': {
    id: 'space-gardener', title: 'Космический садовник', icon: '🌱', kind: '2D', ages: '6–10 лет', color: '#7ef09a',
    text: 'Рисуй пальцем лиану от кометы к горшку и поливай цветок. Чёрные дыры, астероиды и слабая гравитация мешают воде долететь.',
    card: 'Нарисуй лиану от кометы к горшку и полей цветок.',
    tags: ['Головоломка', 'Рисуй пальцем', '3 звезды'],
  },
  drawing: { id: 'drawing', title: 'Рисовалка', icon: '🖍️', kind: '2D', ages: '3–15 лет', color: '#ff7eb6', text: 'Рисуй пальцем или мышкой: кисти, цвета, штампы.', tags: ['Творчество'] },
  puzzles: { id: 'puzzles', title: 'Пазлы', icon: '🧩', kind: '2D', ages: '3–12 лет', color: '#ff9f43', text: 'Собирай картинки из кусочков, от простых до сложных.', tags: ['Логика'] },
  'letter-eater': { id: 'letter-eater', title: 'Буквоед', icon: '🔤', kind: '2D', ages: '6–10 лет', color: '#ffd25a', text: 'Корми Буквоеда нужными буквами и учи алфавит.', tags: ['Буквы'] },
  'animal-orchestra': { id: 'animal-orchestra', title: 'Звериный оркестр', icon: '🎵', kind: '2D', ages: '3–6 лет', color: '#a99bff', text: 'Звери играют музыку, а ты дирижируешь.', tags: ['Музыка'] },
  counting: { id: 'counting', title: 'Считай и играй', icon: '🔢', kind: '2D', ages: '3–8 лет', color: '#7ee7ff', text: 'Счёт на четырёх языках: русский, украинский, румынский, английский.', tags: ['Цифры', '4 языка'] },
  'who-lives-where': { id: 'who-lives-where', title: 'Кто где живёт', icon: '🏡', kind: '2D', ages: '3–6 лет', color: '#7ef09a', text: 'Помоги зверятам найти свой домик.', tags: ['Животные'] },
};

export const ALL_IDS: ShowcaseId[] = [...BIG_IDS, ...SMALL_IDS];
export const isBig = (id: ShowcaseId): id is BigId => (BIG_IDS as readonly string[]).includes(id);
