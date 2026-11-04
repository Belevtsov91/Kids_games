import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'space-gardener',
  title: 'Космический садовник',
  titles: { uk: 'Космічний садівник', ro: 'Grădinarul spațial', en: 'Space Gardener' },
  emoji: '🌱',
  kind: '2d',
  ages: { min: 6, max: 10 },
  skills: ['logic', 'space'],
  stickers: [
    { id: 'first-bloom', emoji: '🌸', title: 'Первый цветок', titles: { uk: 'Перша квітка', ro: 'Prima floare', en: 'First bloom' } },
    { id: 'three-stars', emoji: '⭐', title: 'Три звезды', titles: { uk: 'Три зірки', ro: 'Trei stele', en: 'Three stars' } },
    { id: 'all-gardens', emoji: '🪐', title: 'Все сады', titles: { uk: 'Усі сади', ro: 'Toate grădinile', en: 'All the gardens' } },
  ],
  about: 'Логика и пространство: ребёнок рисует путь для капель, видит, как работает физика, и ищет решение короче.',
  abouts: {
    uk: 'Логіка й простір: дитина малює шлях для крапель, бачить, як працює фізика, і шукає коротше рішення.',
    ro: 'Logică și spațiu: copilul desenează drumul picăturilor, vede cum lucrează fizica și caută o soluție mai scurtă.',
    en: 'Logic and space: the child draws a path for the drops, sees physics at work and looks for a shorter solution.',
  },
  together: 'Перед тем как рисовать, спросите: «Куда покатится капля?» Если не вышло, вместе найдите, где она свернула не туда.',
  togethers: {
    uk: 'Перш ніж малювати, запитайте: «Куди покотиться крапля?» Якщо не вийшло, разом знайдіть, де вона звернула не туди.',
    ro: 'Înainte de a desena, întrebați: „Încotro se va rostogoli picătura?” Dacă nu iese, găsiți împreună unde a luat-o greșit.',
    en: 'Before drawing, ask: “Where will the drop roll?” If it fails, find together where it went the wrong way.',
  },
  tagline: 'Нарисуй лиану от кометы к горшку и полей цветок.',
  taglines: { uk: 'Намалюй ліану від комети до горщика й полий квітку.', ro: 'Desenează o liană de la cometă la ghiveci și udă floarea.', en: 'Draw a vine from the comet to the pot and water the flower.' },
  color: '#6ff0c0',
});
