import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'dragon-breath',
  title: 'Дыши с дракончиком',
  titles: { uk: 'Дихай з драконом', ro: 'Respiră cu dragonul', en: 'Breathe with Dragon' },
  emoji: '🐉',
  kind: '2d',
  ages: { min: 3, max: 8 },
  skills: ['routine'],
  stickers: [
    { id: 'first-calm', emoji: '🎈', title: 'Первая спокойная минутка', titles: { uk: 'Перша спокійна хвилинка', ro: 'Primul minut de liniște', en: 'First calm minute' } },
    { id: 'new-color', emoji: '🎨', title: 'Цветной дракончик', titles: { uk: 'Кольоровий дракон', ro: 'Dragon colorat', en: 'Colourful dragon' } },
    { id: 'calm-ten', emoji: '🐉', title: 'Десять спокойных минуток', titles: { uk: 'Десять спокійних хвилинок', ro: 'Zece minute de liniște', en: 'Ten calm minutes' } },
  ],
  about: 'Саморегуляция: спокойное дыхание помогает ребёнку справляться с волнением, злостью и перед сном.',
  abouts: {
    uk: 'Саморегуляція: спокійне дихання допомагає дитині впоратися з хвилюванням, злістю й перед сном.',
    ro: 'Autoreglare: respirația liniștită îl ajută pe copil cu emoțiile puternice și înainte de somn.',
    en: 'Self-regulation: slow breathing helps the child handle worry, anger and settle before sleep.',
  },
  together: 'Дышите вместе с дракончиком перед сном или после ссоры. Положите ладонь на живот и почувствуйте, как он поднимается.',
  togethers: {
    uk: 'Дихайте разом із драконом перед сном або після сварки. Покладіть долоню на живіт і відчуйте, як він піднімається.',
    ro: 'Respirați împreună cu dragonul înainte de somn sau după o ceartă. Puneți palma pe burtică și simțiți cum se ridică.',
    en: 'Breathe along with the dragon before bed or after an argument. Put a hand on the tummy and feel it rise.',
  },
});
