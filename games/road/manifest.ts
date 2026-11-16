import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'road',
  title: 'Безопасная дорога',
  titles: { uk: 'Безпечна дорога', ro: 'Drumul sigur', en: 'Safe Road' },
  emoji: '🚦',
  kind: '2d',
  ages: { min: 4, max: 8 },
  skills: ['logic', 'routine'],
  stickers: [
    { id: 'traffic-light', emoji: '🚦', title: 'Друг светофора', titles: { uk: 'Друг світлофора', ro: 'Prietenul semaforului', en: 'Traffic light friend' } },
    { id: 'zebra', emoji: '🚸', title: 'По зебре', titles: { uk: 'По зебрі', ro: 'Pe zebră', en: 'Zebra crossing' } },
    { id: 'found', emoji: '🧭', title: 'Не потеряюсь', titles: { uk: 'Не загублюся', ro: 'Nu mă pierd', en: 'I won’t get lost' } },
    { id: 'road-hero', emoji: '🦺', title: 'Знаток дороги', titles: { uk: 'Знавець дороги', ro: 'Expert în trafic', en: 'Road expert' } },
  ],
  about: 'Безопасность: сигналы светофора, переход по зебре и что делать, если ребёнок потерялся.',
  abouts: {
    uk: 'Безпека: сигнали світлофора, перехід по зебрі та що робити, якщо дитина загубилася.',
    ro: 'Siguranță: semnalele semaforului, traversarea pe zebră și ce faci dacă te pierzi.',
    en: 'Safety: traffic light signals, crossing at the zebra and what to do if a child gets lost.',
  },
  together: 'На прогулке остановитесь у перехода и спросите: «Что говорит светофор?» Договоритесь о месте встречи и выучите телефон мамы.',
  togethers: {
    uk: 'На прогулянці зупиніться біля переходу й запитайте: «Що каже світлофор?» Домовтеся про місце зустрічі й вивчіть телефон мами.',
    ro: 'La plimbare, opriți-vă la trecere și întrebați: „Ce spune semaforul?” Stabiliți un loc de întâlnire și învățați telefonul mamei.',
    en: 'On a walk, stop at a crossing and ask: “What does the traffic light say?” Agree on a meeting place and learn mum’s phone number.',
  },
  tagline: 'Помоги Тёпе перейти дорогу и не потеряться.',
  taglines: { uk: 'Допоможи Тьопі перейти дорогу й не загубитися.', ro: 'Ajută-l pe Teo să traverseze și să nu se piardă.', en: 'Help Teddy cross the road and not get lost.' },
  color: '#3f7bff',
});
