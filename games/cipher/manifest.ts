import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'cipher',
  title: 'Тайная почта',
  titles: { uk: 'Таємна пошта', ro: 'Poșta secretă', en: 'Secret Post' },
  emoji: '✉️',
  kind: '2d',
  ages: { min: 9, max: 14 },
  skills: ['logic', 'letters', 'reading'],
  stickers: [
    { id: 'first-letter', emoji: '✉️', title: 'Первое письмо', titles: { uk: 'Перший лист', ro: 'Prima scrisoare', en: 'First letter' } },
    { id: 'wheel-master', emoji: '🎡', title: 'Мастер колеса', titles: { uk: 'Майстер колеса', ro: 'Maestrul roții', en: 'Wheel master' } },
    { id: 'lighthouse-keeper', emoji: '🗼', title: 'Смотритель маяка', titles: { uk: 'Доглядач маяка', ro: 'Paznicul farului', en: 'Lighthouse keeper' } },
    { id: 'riddle-solver', emoji: '🧩', title: 'Разгадчик', titles: { uk: 'Розгадувач', ro: 'Dezlegătorul', en: 'Riddle solver' } },
    { id: 'postmaster', emoji: '📮', title: 'Главный почтмейстер', titles: { uk: 'Головний поштмейстер', ro: 'Șeful poștei', en: 'Postmaster' } },
  ],
  about: 'Основы логики и криптографии: шифр Цезаря на колесе, азбука Морзе от маяка и письма-загадки.',
  abouts: {
    uk: 'Основи логіки та криптографії: шифр Цезаря на колесі, абетка Морзе від маяка й листи-загадки.',
    ro: 'Bazele logicii și ale criptografiei: cifrul lui Cezar pe roată, alfabetul Morse de la far și scrisori-ghicitori.',
    en: 'Logic and cryptography basics: the Caesar cipher on a wheel, Morse code from a lighthouse and riddle letters.',
  },
  together: 'Зашифруйте друг другу записку колесом со сдвигом 3, а потом простучите имя ребёнка азбукой Морзе по столу.',
  togethers: {
    uk: 'Зашифруйте одне одному записку колесом зі зсувом 3, а потім простукайте імʼя дитини абеткою Морзе по столу.',
    ro: 'Scrieți-vă unul altuia un bilet cifrat cu roata cu deplasare 3, apoi bateți numele copilului în Morse pe masă.',
    en: 'Write each other a note with the wheel at shift 3, then tap the child’s name in Morse code on the table.',
  },
  tagline: 'Помоги Тёпе прочитать тайные письма острова.',
  taglines: { uk: 'Допоможи Тьопі прочитати таємні листи острова.', ro: 'Ajută-l pe Tiopa să citească scrisorile secrete ale insulei.', en: 'Help Tyopa read the island’s secret letters.' },
  color: '#6a4fd0',
});
