import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'little-shop',
  title: 'Магазинчик',
  titles: { uk: 'Крамничка', ro: 'Magazinul mic', en: 'Little Shop' },
  emoji: '🏪',
  kind: '2d',
  ages: { min: 5, max: 8 },
  skills: ['count', 'numbers', 'sizes'],
  stickers: [
    { id: 'scales', emoji: '⚖️', title: 'Знаток весов', titles: { uk: 'Знавець терезів', ro: 'Expert la cântar', en: 'Scales expert' } },
    { id: 'juice', emoji: '🧃', title: 'Точный сок', titles: { uk: 'Точний сік', ro: 'Suc exact', en: 'Perfect pour' } },
    { id: 'cashier', emoji: '🪙', title: 'Кассир', titles: { uk: 'Касир', ro: 'Casier', en: 'Cashier' } },
    { id: 'change', emoji: '💰', title: 'Сдача без ошибок', titles: { uk: 'Решта без помилок', ro: 'Restul corect', en: 'Correct change' } },
  ],
  about: 'Математика в жизни: сравнить вес, уравновесить весы гирьками, налить до отметки, заплатить монетами и дать сдачу.',
  abouts: {
    uk: 'Математика в житті: порівняти вагу, урівноважити терези, налити до позначки, заплатити монетами й дати решту.',
    ro: 'Matematica de zi cu zi: comparăm greutăți, echilibrăm cântarul, turnăm până la semn, plătim cu monede și dăm restul.',
    en: 'Everyday maths: compare weights, balance the scales, pour to the line, pay with coins and give change.',
  },
  together: 'Будьте покупателем: «Мне яблоко за 3 монеты». Потом поиграйте в магазин с настоящими монетами.',
  togethers: {
    uk: 'Будьте покупцем: «Мені яблуко за 3 монети». Потім пограйтеся в магазин зі справжніми монетами.',
    ro: 'Fiți cumpărătorul: „Vreau un măr de 3 monede”. Apoi jucați-vă de-a magazinul cu monede adevărate.',
    en: 'Be the customer: “One apple for 3 coins, please.” Then play shop with real coins.',
  },
  tagline: 'Стань продавцом: взвешивай, считай монеты и давай сдачу.',
  taglines: { uk: 'Стань продавцем: зважуй, рахуй монети й давай решту.', ro: 'Fii vânzător: cântărește, numără monedele și dă restul.', en: 'Be the shopkeeper: weigh, count coins and give change.' },
  color: '#ffc06b',
});
