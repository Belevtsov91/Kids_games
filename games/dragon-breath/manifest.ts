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
});
