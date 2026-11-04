import { defineManifest } from '@ig/sdk';
export default defineManifest({
  id: 'counting',
  title: 'Считай и играй',
  titles: { uk: 'Лічи та грай', ro: 'Numără și joacă', en: 'Count & play' },
  emoji: '🔢',
  kind: '2d',
  ages: { min: 3, max: 8 },
  skills: ['count', 'numbers', 'logic'],
  stickers: [
    { id: 'first-game', emoji: '🔢', title: 'Первая серия', titles: { uk: 'Перша серія', ro: 'Prima serie', en: 'First round' } },
    { id: 'all-stars', emoji: '⭐', title: 'Пять звёзд', titles: { uk: 'П’ять зірок', ro: 'Cinci stele', en: 'Five stars' } },
    { id: 'big-numbers', emoji: '🔟', title: 'Большие числа', titles: { uk: 'Великі числа', ro: 'Numere mari', en: 'Big numbers' } },
    { id: 'all-modes', emoji: '🏆', title: 'Все задания', titles: { uk: 'Усі завдання', ro: 'Toate jocurile', en: 'Every mode' } },
  ],
});
