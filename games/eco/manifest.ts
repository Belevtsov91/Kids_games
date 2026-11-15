import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'eco',
  title: 'Эко-город',
  titles: { uk: 'Еко-місто', ro: 'Orașul eco', en: 'Eco City' },
  emoji: '🌱',
  kind: '2d',
  ages: { min: 10, max: 15 },
  skills: ['logic', 'numbers', 'nature'],
  stickers: [
    { id: 'first-light', emoji: '💡', title: 'Первый свет', titles: { uk: 'Перше світло', ro: 'Prima lumină', en: 'First light' } },
    { id: 'wind-power', emoji: '🌬️', title: 'Сила ветра', titles: { uk: 'Сила вітру', ro: 'Puterea vântului', en: 'Wind power' } },
    { id: 'night-keeper', emoji: '🔋', title: 'Хранитель ночи', titles: { uk: 'Охоронець ночі', ro: 'Paznicul nopții', en: 'Night keeper' } },
    { id: 'thrifty', emoji: '🪙', title: 'Бережливый инженер', titles: { uk: 'Ощадливий інженер', ro: 'Inginer econom', en: 'Thrifty engineer' } },
    { id: 'eco-mayor', emoji: '🏙️', title: 'Мэр Эко-города', titles: { uk: 'Мер Еко-міста', ro: 'Primarul orașului eco', en: 'Mayor of Eco City' } },
  ],
  about: 'Головоломка про энергию: солнечные панели, ветряки и батареи должны кормить город и днём, и ночью. Учит читать график, считать запас и искать самое экономное решение.',
  abouts: {
    uk: 'Головоломка про енергію: сонячні панелі, вітряки й батареї мають живити місто і вдень, і вночі. Вчить читати графік, рахувати запас і шукати найощадливіше рішення.',
    ro: 'Un joc logic despre energie: panourile solare, turbinele și bateriile trebuie să alimenteze orașul și ziua, și noaptea. Învață să citești un grafic, să calculezi rezerva și să cauți soluția cea mai economă.',
    en: 'An energy puzzle: solar panels, wind turbines and batteries must power the town by day and by night. It teaches reading a chart, budgeting a reserve and looking for the thriftiest solution.',
  },
  together: 'Посмотрите вместе на график: когда дома тратят больше всего и откуда в это время берётся энергия? Обсудите, почему ночью нужны батареи или ветер.',
  togethers: {
    uk: 'Подивіться разом на графік: коли будинки витрачають найбільше і звідки в цей час береться енергія? Обговоріть, чому вночі потрібні батареї або вітер.',
    ro: 'Uitați-vă împreună la grafic: când consumă casele cel mai mult și de unde vine atunci energia? Discutați de ce noaptea e nevoie de baterii sau de vânt.',
    en: 'Look at the chart together: when do the homes use the most, and where does the energy come from then? Talk about why the night needs batteries or wind.',
  },
  tagline: 'Помоги Тёпе зажечь город солнцем и ветром.',
  taglines: { uk: 'Допоможи Тьопі засвітити місто сонцем і вітром.', ro: 'Ajută-l pe Teo să lumineze orașul cu soare și vânt.', en: 'Help Teddy light up the town with sun and wind.' },
  color: '#5be36b',
});
