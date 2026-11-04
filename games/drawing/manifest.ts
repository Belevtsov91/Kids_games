import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'drawing',
  title: 'Рисовалка',
  titles: { uk: 'Малювалка', ro: 'Desenăm', en: 'Drawing' },
  emoji: '🖍️',
  kind: '2d',
  ages: { min: 3, max: 15 },
  skills: ['creativity', 'colors', 'motor'],
  stickers: [
    { id: 'first-drawing', emoji: '🖍️', title: 'Первый рисунок', titles: { uk: 'Перший малюнок', ro: 'Primul desen', en: 'First drawing' } },
    { id: 'first-coloring', emoji: '🎨', title: 'Первая раскраска', titles: { uk: 'Перша розмальовка', ro: 'Prima colorare', en: 'First colouring' } },
    { id: 'ten-drawings', emoji: '🖼️', title: 'Десять рисунков', titles: { uk: 'Десять малюнків', ro: 'Zece desene', en: 'Ten drawings' } },
  ],
  tagline: 'Рисуй, раскрашивай и сохраняй рисунки в галерею.',
  taglines: { uk: 'Малюй, розфарбовуй і зберігай малюнки в галерею.', ro: 'Desenează, colorează și păstrează desenele în galerie.', en: 'Draw, colour in and keep your pictures in a gallery.' },
  color: '#ff7eb6',
});
