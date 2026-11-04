import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'letter-eater',
  title: 'Буквоед',
  titles: { uk: 'Буквоїд', ro: 'Mâncătorul de litere', en: 'Letter Eater' },
  emoji: '🔤',
  kind: '2d',
  ages: { min: 6, max: 10 },
  skills: ['letters', 'reading'],
  stickers: [
    { id: 'first-word', emoji: '🍪', title: 'Первое слово', titles: { uk: 'Перше слово', ro: 'Primul cuvânt', en: 'First word' } },
    { id: 'three-stars', emoji: '⭐', title: 'Три звезды', titles: { uk: 'Три зірки', ro: 'Trei stele', en: 'Three stars' } },
    { id: 'champion', emoji: '🏆', title: 'Чемпион букв', titles: { uk: 'Чемпіон літер', ro: 'Campionul literelor', en: 'Letter champion' } },
  ],
  about: 'Буквы и первое чтение: ребёнок находит буквы по порядку, собирает слово и слышит, как оно звучит.',
  abouts: {
    uk: 'Літери й перше читання: дитина знаходить літери по порядку, складає слово й чує, як воно звучить.',
    ro: 'Litere și primele lecturi: copilul găsește literele în ordine, formează cuvântul și îl aude rostit.',
    en: 'Letters and early reading: the child finds letters in order, builds the word and hears how it sounds.',
  },
  together: 'Читайте слово вслух вместе, растягивая звуки: «ммм-ааа-ммм-ааа». Потом найдите дома предмет на ту же букву.',
  togethers: {
    uk: 'Читайте слово вголос разом, розтягуючи звуки: «ммм-ааа-ммм-ааа». Потім знайдіть удома предмет на ту саму літеру.',
    ro: 'Citiți cuvântul cu voce tare împreună, lungind sunetele: „mmm-aaa-mmm-aaa”. Apoi găsiți în casă un obiect cu aceeași literă.',
    en: 'Read the word aloud together, stretching the sounds: “mmm-aaa-mmm”. Then find something at home that starts with the same letter.',
  },
  tagline: 'Корми пушистого Буквоеда буквами и собирай слова.',
  taglines: { uk: 'Годуй пухнастого Буквоїда літерами та складай слова.', ro: 'Hrănește-l pe Mâncătorul de litere și formează cuvinte.', en: 'Feed the fluffy Letter Eater and build words.' },
  color: '#c09bff',
});
