import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'puzzles',
  title: 'Пазлы',
  titles: { uk: 'Пазли', ro: 'Puzzle-uri', en: 'Puzzles' },
  emoji: '🧩',
  kind: '2d',
  ages: { min: 3, max: 12 },
  skills: ['space'],
  stickers: [
    { id: 'first-puzzle', emoji: '🧩', title: 'Первый пазл', titles: { uk: 'Перший пазл', ro: 'Primul puzzle', en: 'First puzzle' } },
    { id: 'big-puzzle', emoji: '🖼️', title: 'Большой пазл', titles: { uk: 'Великий пазл', ro: 'Puzzle mare', en: 'Big puzzle' } },
    { id: 'huge-puzzle', emoji: '🏰', title: 'Огромный пазл', titles: { uk: 'Величезний пазл', ro: 'Puzzle uriaș', en: 'Huge puzzle' } },
    { id: 'own-picture', emoji: '📷', title: 'Своя картинка', titles: { uk: 'Своя картинка', ro: 'Poza mea', en: 'My own picture' } },
    { id: 'ten-puzzles', emoji: '🏅', title: 'Десять пазлов', titles: { uk: 'Десять пазлів', ro: 'Zece puzzle-uri', en: 'Ten puzzles' } },
  ],
});
