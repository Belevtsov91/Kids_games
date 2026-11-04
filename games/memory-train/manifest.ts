import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'memory-train',
  title: 'Паровозик памяти',
  titles: { uk: 'Потяг пам’яті', ro: 'Trenulețul memoriei', en: 'Memory Train' },
  emoji: '🚂',
  kind: '2d',
  ages: { min: 4, max: 8 },
  skills: ['memory', 'animals'],
  stickers: [
    { id: 'first-ride', emoji: '🚂', title: 'Первая поездка', titles: { uk: 'Перша поїздка', ro: 'Prima călătorie', en: 'First ride' } },
    { id: 'long-train', emoji: '🚃', title: 'Длинный поезд', titles: { uk: 'Довгий потяг', ro: 'Tren lung', en: 'Long train' } },
    { id: 'conductor', emoji: '🎫', title: 'Главный кондуктор', titles: { uk: 'Головний кондуктор', ro: 'Conductorul-șef', en: 'Head conductor' } },
  ],
  about: 'Рабочая память и внимание: запомнить, кто в каком вагоне, кто вышел и в каком порядке ехали.',
  abouts: {
    uk: 'Робоча пам’ять і увага: запам’ятати, хто в якому вагоні, хто вийшов і в якому порядку їхали.',
    ro: 'Memorie de lucru și atenție: cine e în ce vagon, cine a coborât și în ce ordine au călătorit.',
    en: 'Working memory and attention: who is in which carriage, who got off, and in what order they rode.',
  },
  together: 'Играйте по очереди: кто запомнит больше вагонов? Проговаривайте вслух: «синий вагон — котик».',
  togethers: {
    uk: 'Грайте по черзі: хто запам’ятає більше вагонів? Проговорюйте вголос: «синій вагон — котик».',
    ro: 'Jucați pe rând: cine ține minte mai multe vagoane? Spuneți cu voce tare: „vagonul albastru — pisica”.',
    en: 'Take turns: who remembers more carriages? Say it out loud: “blue carriage — cat”.',
  },
});
