import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'sleepy-bear',
  title: 'Тёпа идёт спать',
  titles: { uk: 'Тьопа йде спати', ro: 'Teo merge la culcare', en: 'Teddy’s Bedtime' },
  emoji: '🧸',
  kind: '2d',
  ages: { min: 3, max: 5 },
  skills: ['colors', 'shapes', 'sizes', 'count', 'routine', 'motor'],
  about: 'Спокойная игра перед сном: ужин, купание, зубки, пижама и звёзды в окне. Цвета, фигуры, «большой — маленький» и счёт до пяти, без слов на экране и без проигрышей.',
  abouts: {
    uk: 'Спокійна гра перед сном: вечеря, купання, зубки, піжама і зорі у вікні. Кольори, фігури, «великий — маленький» і лічба до п’яти, без слів на екрані й без програшів.',
    ro: 'Un joc liniștit înainte de somn: cină, baie, dinți, pijama și stele la fereastră. Culori, forme, „mare — mic” și numărat până la cinci, fără text pe ecran și fără pierderi.',
    en: 'A calm game before bed: dinner, bath, teeth, pyjamas and stars in the window. Colours, shapes, big and small, and counting to five — no text on screen and no way to lose.',
  },
  stickers: [
    { id: 'first-night', emoji: '🧸', title: 'Первая ночь Тёпы', titles: { uk: 'Перша ніч Тьопи', ro: 'Prima noapte a lui Teo', en: 'Teddy’s first night' } },
    { id: 'pajama-stars', emoji: '⭐', title: 'Пижама со звёздами', titles: { uk: 'Піжама із зірками', ro: 'Pijama cu stele', en: 'Star pyjamas' } },
    { id: 'pajama-dots', emoji: '🔵', title: 'Пижама в горошек', titles: { uk: 'Піжама в горошок', ro: 'Pijama cu buline', en: 'Polka-dot pyjamas' } },
    { id: 'pajama-stripes', emoji: '🦓', title: 'Полосатая пижама', titles: { uk: 'Смугаста піжама', ro: 'Pijama în dungi', en: 'Striped pyjamas' } },
    { id: 'pajama-hearts', emoji: '💗', title: 'Пижама с сердечками', titles: { uk: 'Піжама із сердечками', ro: 'Pijama cu inimioare', en: 'Heart pyjamas' } },
    { id: 'pajama-moons', emoji: '🌙', title: 'Пижама с лунами', titles: { uk: 'Піжама з місяцями', ro: 'Pijama cu luni', en: 'Moon pyjamas' } },
    { id: 'clean-paws', emoji: '🛁', title: 'Чистые лапки', titles: { uk: 'Чисті лапки', ro: 'Lăbuțe curate', en: 'Clean paws' } },
    { id: 'seven-nights', emoji: '🌌', title: 'Семь спокойных ночей', titles: { uk: 'Сім спокійних ночей', ro: 'Șapte nopți liniștite', en: 'Seven calm nights' } },
  ],
});
