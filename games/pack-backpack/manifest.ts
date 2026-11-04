import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'pack-backpack',
  title: 'Собери рюкзак',
  titles: { uk: 'Збери рюкзак', ro: 'Fă-ți rucsacul', en: 'Pack Your Bag' },
  emoji: '🎒',
  kind: '2d',
  ages: { min: 3, max: 6 },
  skills: ['routine', 'logic'],
  stickers: [
    { id: 'first-trip', emoji: '🎒', title: 'Первый рюкзак', titles: { uk: 'Перший рюкзак', ro: 'Primul rucsac', en: 'First bag' } },
    { id: 'rain-ready', emoji: '☂️', title: 'Готов к дождю', titles: { uk: 'Готовий до дощу', ro: 'Gata de ploaie', en: 'Ready for rain' } },
    { id: 'snow-ready', emoji: '⛄', title: 'Готов к снегу', titles: { uk: 'Готовий до снігу', ro: 'Gata de zăpadă', en: 'Ready for snow' } },
    { id: 'traveller', emoji: '🧭', title: 'Путешественник', titles: { uk: 'Мандрівник', ro: 'Călător', en: 'Traveller' } },
  ],
  about: 'Самостоятельность и логика: ребёнок решает, что взять с собой в зависимости от погоды и места.',
  abouts: {
    uk: 'Самостійність і логіка: дитина вирішує, що взяти з собою залежно від погоди й місця.',
    ro: 'Independență și logică: copilul decide ce să ia cu el în funcție de vreme și de loc.',
    en: 'Independence and logic: the child decides what to take depending on the weather and the place.',
  },
});
