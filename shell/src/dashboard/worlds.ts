import type { Locale } from '@/i18n/locale';

// Цвет свечения портала и короткое описание каждой игры на дашборде. Обложки берутся как есть из games/*/assets.
interface World {
  color: string;
  text: Record<Locale, string>;
}

const WORLDS: Record<string, World> = {
  'moon-valley': {
    color: '#b7a6ff',
    text: {
      ru: '3D-приключение: квесты, свой питомец, смена дня и ночи.',
      uk: '3D-пригода: квести, свій улюбленець, зміна дня і ночі.',
      ro: 'Aventură 3D: misiuni, un animăluț al tău, zi și noapte.',
      en: 'A 3D adventure with quests, a pet and day and night.',
    },
  },
  'island-builder': {
    color: '#7ee7ff',
    text: {
      ru: 'Блоки, деревья, лодки и фонари. Построй свой остров.',
      uk: 'Блоки, дерева, човни й ліхтарі. Збудуй свій острів.',
      ro: 'Blocuri, copaci, bărci și felinare. Construiește-ți insula.',
      en: 'Blocks, trees, boats and lanterns. Build your own island.',
    },
  },
  playground3d: {
    color: '#ffd25a',
    text: {
      ru: 'Пирамидки, кубики и шарики с настоящей физикой.',
      uk: 'Пірамідки, кубики й кульки зі справжньою фізикою.',
      ro: 'Piramide, cuburi și bile cu fizică adevărată.',
      en: 'Stacking toys, blocks and marbles with real physics.',
    },
  },
  'space-gardener': {
    color: '#6ff0c0',
    text: {
      ru: 'Нарисуй лиану от кометы к горшку и полей цветок.',
      uk: 'Намалюй ліану від комети до горщика й полий квітку.',
      ro: 'Desenează o liană de la cometă la ghiveci și udă floarea.',
      en: 'Draw a vine from the comet to the pot and water the flower.',
    },
  },
  'animal-orchestra': {
    color: '#ffa36b',
    text: {
      ru: 'Мишка, котик и лягушонок играют музыку. Повтори мелодию.',
      uk: 'Ведмедик, котик і жабеня грають музику. Повтори мелодію.',
      ro: 'Ursulețul, pisoiul și broscuța cântă. Repetă melodia.',
      en: 'A bear, a kitten and a frog play music. Repeat the tune.',
    },
  },
  counting: {
    color: '#ffb347',
    text: {
      ru: 'Считай морковки вместе с зайчиком и белкой.',
      uk: 'Лічи морквинки разом із зайчиком і білкою.',
      ro: 'Numără morcovii împreună cu iepurașul și veverița.',
      en: 'Count carrots together with the bunny and the squirrel.',
    },
  },
  drawing: {
    color: '#ff7eb6',
    text: {
      ru: 'Рисуй, раскрашивай и сохраняй рисунки в галерею.',
      uk: 'Малюй, розфарбовуй і зберігай малюнки в галерею.',
      ro: 'Desenează, colorează și păstrează desenele în galerie.',
      en: 'Draw, colour in and keep your pictures in a gallery.',
    },
  },
  'letter-eater': {
    color: '#c09bff',
    text: {
      ru: 'Корми пушистого Буквоеда буквами и собирай слова.',
      uk: 'Годуй пухнастого Буквоїда літерами та складай слова.',
      ro: 'Hrănește-l pe Mâncătorul de litere și formează cuvinte.',
      en: 'Feed the fluffy Letter Eater and build words.',
    },
  },
  puzzles: {
    color: '#9be38c',
    text: {
      ru: 'Собирай сказочные картинки из кусочков.',
      uk: 'Збирай казкові картинки зі шматочків.',
      ro: 'Asamblează imagini de poveste din bucăți.',
      en: 'Put fairy-tale pictures together piece by piece.',
    },
  },
  'who-lives-where': {
    color: '#ffc86b',
    text: {
      ru: 'Помоги лисёнку, черепахе и птичке найти свои домики.',
      uk: 'Допоможи лисеняті, черепасі й пташці знайти свої хатки.',
      ro: 'Ajută vulpița, broasca țestoasă și păsărica să-și găsească casa.',
      en: 'Help the fox, the tortoise and the bird find their homes.',
    },
  },
};

const FALLBACK = '#ffd25a';

export const worldColor = (id: string) => WORLDS[id]?.color ?? FALLBACK;
export const worldText = (id: string, locale: Locale) => WORLDS[id]?.text[locale] ?? '';
