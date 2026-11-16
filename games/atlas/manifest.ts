import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'atlas',
  title: 'Путешественник',
  titles: { uk: 'Мандрівник', ro: 'Călătorul', en: 'Traveller' },
  emoji: '🌍',
  kind: '2d',
  ages: { min: 8, max: 14 },
  skills: ['space', 'memory'],
  stickers: [
    { id: 'first-flight', emoji: '🎈', title: 'Первый полёт', titles: { uk: 'Перший політ', ro: 'Primul zbor', en: 'First flight' } },
    { id: 'home-route', emoji: '🏡', title: 'Мой дом', titles: { uk: 'Мій дім', ro: 'Casa mea', en: 'My home' } },
    { id: 'europe-route', emoji: '🏰', title: 'Знаток Европы', titles: { uk: 'Знавець Європи', ro: 'Cunoscătorul Europei', en: 'Europe expert' } },
    { id: 'world-route', emoji: '🌏', title: 'Вокруг света', titles: { uk: 'Навколо світу', ro: 'În jurul lumii', en: 'Around the world' } },
    { id: 'perfect-route', emoji: '🧭', title: 'Без единой ошибки', titles: { uk: 'Без жодної помилки', ro: 'Fără nicio greșeală', en: 'Not a single mistake' } },
    { id: 'flag-master', emoji: '🚩', title: 'Мастер флагов', titles: { uk: 'Майстер прапорів', ro: 'Maestrul steagurilor', en: 'Flag master' } },
    { id: 'globe-trotter', emoji: '🏆', title: 'Великий путешественник', titles: { uk: 'Великий мандрівник', ro: 'Marele călător', en: 'Great traveller' } },
  ],
  about: 'География без зубрёжки: флаги, столицы и где страна на глобусе. Сначала Молдова, Украина и Румыния, потом Европа и весь мир.',
  abouts: {
    uk: 'Географія без зубріння: прапори, столиці й де країна на глобусі. Спершу Молдова, Україна й Румунія, потім Європа і весь світ.',
    ro: 'Geografie fără tocit: steaguri, capitale și unde e țara pe glob. Întâi Moldova, Ucraina și România, apoi Europa și toată lumea.',
    en: 'Geography without cramming: flags, capitals and where a country is on the globe. Moldova, Ukraine and Romania first, then Europe and the world.',
  },
  together: 'Откройте «Атлас» и найдите страны, где живут родные или куда вы ездили. Спросите, чем похожи флаги Молдовы и Румынии.',
  togethers: {
    uk: 'Відкрийте «Атлас» і знайдіть країни, де живуть рідні або куди ви їздили. Запитайте, чим схожі прапори Молдови й Румунії.',
    ro: 'Deschideți „Atlasul” și găsiți țările unde locuiesc rudele sau unde ați călătorit. Întrebați prin ce se aseamănă steagurile Moldovei și României.',
    en: 'Open the Atlas and find the countries where relatives live or where you have travelled. Ask how the flags of Moldova and Romania are alike.',
  },
  tagline: 'Лети с Тёпой на воздушном шаре: флаги, столицы и глобус.',
  taglines: {
    uk: 'Лети з Тьопою на повітряній кулі: прапори, столиці й глобус.',
    ro: 'Zboară cu Teo în balon: steaguri, capitale și globul.',
    en: 'Fly with Teddy in a hot-air balloon: flags, capitals and the globe.',
  },
  color: '#5b9dff',
  addedAt: '2026-11-15',
});
