import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'star-navigator',
  title: 'Звёздный штурман',
  titles: { uk: 'Зоряний штурман', ro: 'Navigatorul stelar', en: 'Star Navigator' },
  emoji: '🚀',
  kind: '2d',
  ages: { min: 10, max: 15 },
  skills: ['space', 'logic'],
  stickers: [
    { id: 'first-flight', emoji: '🚀', title: 'Первый полёт', titles: { uk: 'Перший політ', ro: 'Primul zbor', en: 'First flight' } },
    { id: 'first-orbit', emoji: '🛰️', title: 'На орбите', titles: { uk: 'На орбіті', ro: 'Pe orbită', en: 'In orbit' } },
    { id: 'slingshot', emoji: '🪐', title: 'Гравитационный манёвр', titles: { uk: 'Гравітаційний маневр', ro: 'Manevra gravitațională', en: 'Gravity assist' } },
    { id: 'all-crystals', emoji: '💎', title: 'Собиратель кристаллов', titles: { uk: 'Збирач кристалів', ro: 'Colecționar de cristale', en: 'Crystal collector' } },
    { id: 'navigator', emoji: '🌌', title: 'Звёздный штурман', titles: { uk: 'Зоряний штурман', ro: 'Navigatorul stelar', en: 'Star navigator' } },
  ],
  about: 'Физика на практике: притяжение планет искривляет путь ракеты, а торможение у планеты выводит её на орбиту. Тренирует пространственное мышление и планирование.',
  abouts: {
    uk: 'Фізика на практиці: тяжіння планет викривлює шлях ракети, а гальмування біля планети виводить її на орбіту. Тренує просторове мислення й планування.',
    ro: 'Fizică în practică: atracția planetelor curbează drumul rachetei, iar frânarea lângă planetă o pune pe orbită. Antrenează gândirea spațială și planificarea.',
    en: 'Physics in practice: planetary gravity bends the rocket path, and braking near a planet puts it into orbit. Builds spatial thinking and planning.',
  },
  together: 'Спросите, почему ракета повернула и где ей лучше тормозить. Обсудите, как настоящие зонды летают к дальним планетам с помощью гравитационных манёвров.',
  togethers: {
    uk: 'Запитайте, чому ракета повернула і де їй краще гальмувати. Обговоріть, як справжні зонди летять до далеких планет за допомогою гравітаційних маневрів.',
    ro: 'Întrebați de ce a cotit racheta și unde e mai bine să frâneze. Discutați cum zboară sondele reale spre planete îndepărtate cu ajutorul manevrelor gravitaționale.',
    en: 'Ask why the rocket turned and where it is best to brake. Talk about how real probes reach distant planets using gravity assists.',
  },
  tagline: 'Проложи курс ракеты Тёпы среди планет и звёзд.',
  taglines: { uk: 'Прокладай курс ракети Тьопи серед планет і зір.', ro: 'Trasează drumul rachetei lui Tiopa printre planete și stele.', en: "Plot Tyopa's rocket course among planets and stars." },
  color: '#7b6cff',
  addedAt: '2026-11-15',
});
