import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'playground3d',
  title: '3D песочница',
  titles: { uk: '3D пісочниця', ro: 'Cutia cu nisip 3D', en: '3D Sandbox' },
  emoji: '🧊',
  kind: '3d',
  ages: { min: 5, max: 15 },
  skills: ['space', 'motor'],
  stickers: [
    { id: 'first-toy', emoji: '🧸', title: 'Первая игрушка', titles: { uk: 'Перша іграшка', ro: 'Prima jucărie', en: 'First toy' } },
    { id: 'ten-toys', emoji: '🧱', title: 'Десять игрушек', titles: { uk: 'Десять іграшок', ro: 'Zece jucării', en: 'Ten toys' } },
    { id: 'all-toys', emoji: '🎪', title: 'Все игрушки', titles: { uk: 'Усі іграшки', ro: 'Toate jucăriile', en: 'Every toy' } },
  ],
  about: 'Свободная игра с настоящей физикой: ребёнок видит, как падают, катятся и складываются предметы, и учится точно попадать пальцем.',
  abouts: {
    uk: 'Вільна гра зі справжньою фізикою: дитина бачить, як падають, котяться й складаються предмети, і вчиться влучно торкатися.',
    ro: 'Joc liber cu fizică adevărată: copilul vede cum cad, se rostogolesc și se adună obiectele și învață să atingă precis.',
    en: 'Free play with real physics: your child sees how things fall, roll and stack, and practises tapping precisely.',
  },
  together: 'Предложите задачку: построить башню из кубиков или уложить все шарики в одну кучу. Спросите, почему башня упала.',
  togethers: {
    uk: 'Запропонуйте завдання: збудувати вежу з кубиків або скласти всі кульки в одну купку. Запитайте, чому вежа впала.',
    ro: 'Propuneți o provocare: un turn din cuburi sau toate bilele într-o grămadă. Întrebați de ce a căzut turnul.',
    en: 'Set a little challenge: build a tower of blocks or gather all the marbles in one pile. Ask why the tower fell.',
  },
  tagline: 'Пирамидки, кубики и шарики с настоящей физикой.',
  taglines: { uk: 'Пірамідки, кубики й кульки зі справжньою фізикою.', ro: 'Piramide, cuburi și bile cu fizică adevărată.', en: 'Stacking toys, blocks and marbles with real physics.' },
  color: '#ffd25a',
});
