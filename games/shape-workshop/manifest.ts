import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'shape-workshop',
  title: 'Мастерская фигур',
  titles: { uk: 'Майстерня фігур', ro: 'Atelierul formelor', en: 'Shape Workshop' },
  emoji: '🔺',
  kind: '2d',
  ages: { min: 3, max: 6 },
  skills: ['shapes', 'space', 'creativity'],
  stickers: [
    { id: 'first-picture', emoji: '🏠', title: 'Первая картинка', titles: { uk: 'Перша картинка', ro: 'Primul desen', en: 'First picture' } },
    { id: 'rocket', emoji: '🚀', title: 'Ракета из фигур', titles: { uk: 'Ракета з фігур', ro: 'Racheta din forme', en: 'Shape rocket' } },
    { id: 'all-pictures', emoji: '🏰', title: 'Все картинки собраны', titles: { uk: 'Усі картинки зібрано', ro: 'Toate desenele gata', en: 'All pictures done' } },
    { id: 'free-build', emoji: '🎨', title: 'Своя картинка', titles: { uk: 'Власна картинка', ro: 'Desenul meu', en: 'My own picture' } },
  ],
  about: 'Геометрические фигуры и пространственное мышление: ребёнок узнаёт фигуры и собирает из них картинки по силуэту.',
  abouts: {
    uk: 'Геометричні фігури та просторове мислення: дитина впізнає фігури й складає з них картинки за силуетом.',
    ro: 'Forme geometrice și gândire spațială: copilul recunoaște formele și compune imagini după siluetă.',
    en: 'Shapes and spatial thinking: the child recognises shapes and builds pictures from silhouettes.',
  },
});
