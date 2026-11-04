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
  together: 'Называйте фигуры и цвета вслух, а потом найдите такие же дома. В свободной мастерской попросите рассказать, что получилось.',
  togethers: {
    uk: 'Називайте фігури й кольори вголос, а потім знайдіть такі самі вдома. У вільній майстерні попросіть розповісти, що вийшло.',
    ro: 'Numiți formele și culorile cu voce tare, apoi căutați-le prin casă. În atelierul liber rugați copilul să povestească ce a construit.',
    en: 'Name shapes and colours out loud, then find the same ones at home. In free build, ask what they made.',
  },
  tagline: 'Собери машинку, домик и ракету из фигур.',
  taglines: { uk: 'Збери машинку, будиночок і ракету з фігур.', ro: 'Construiește o mașinuță, o căsuță și o rachetă din forme.', en: 'Build a car, a house and a rocket out of shapes.' },
  color: '#7fd8a8',
});
