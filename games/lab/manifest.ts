import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'lab',
  title: 'Лаборатория изобретателя',
  titles: { uk: 'Лабораторія винахідника', ro: 'Laboratorul inventatorului', en: "Inventor's Lab" },
  emoji: '🔬',
  kind: '3d',
  ages: { min: 9, max: 15 },
  skills: ['logic', 'space'],
  stickers: [
    { id: 'first-light', emoji: '💡', title: 'Первая лампочка', titles: { uk: 'Перша лампочка', ro: 'Primul bec', en: 'First bulb' } },
    { id: 'three-stars', emoji: '🌟', title: 'Три звезды', titles: { uk: 'Три зірки', ro: 'Trei stele', en: 'Three stars' } },
    { id: 'all-levels', emoji: '🏆', title: 'Все задания', titles: { uk: 'Усі завдання', ro: 'Toate misiunile', en: 'Every challenge' } },
    { id: 'master', emoji: '🧪', title: 'Главный изобретатель', titles: { uk: 'Головний винахідник', ro: 'Marele inventator', en: 'Master inventor' } },
  ],
  about: 'Головоломка с настоящей физикой: ребёнок собирает машину из горок, рычагов, маятников и шестерёнок, проверяет идею и исправляет ошибки.',
  abouts: {
    uk: 'Головоломка зі справжньою фізикою: дитина збирає машину з гірок, важелів, маятників і шестерень, перевіряє ідею й виправляє помилки.',
    ro: 'Puzzle cu fizică adevărată: copilul construiește o mașinărie din pante, pârghii, pendule și roți dințate, își testează ideea și repară greșelile.',
    en: 'A puzzle with real physics: your child builds a machine from ramps, levers, pendulums and gears, tests the idea and fixes mistakes.',
  },
  together: 'Перед пуском спросите: «Куда, по-твоему, полетит шарик?» После пуска сравните догадку с тем, что вышло.',
  togethers: {
    uk: 'Перед пуском запитайте: «Куди, на твою думку, полетить кулька?» Після пуску порівняйте здогадку з тим, що вийшло.',
    ro: 'Înainte de pornire întrebați: „Unde crezi că va zbura bila?” După aceea comparați ghicitoarea cu ce s-a întâmplat.',
    en: 'Before pressing Go, ask: "Where do you think the ball will fly?" Afterwards, compare the guess with what happened.',
  },
  tagline: 'Построй машину, и шарик зажжёт лампочку.',
  taglines: { uk: 'Побудуй машину, і кулька запалить лампочку.', ro: 'Construiește mașinăria și bila aprinde becul.', en: 'Build a machine and the ball lights the bulb.' },
  color: '#ffc94d',
  addedAt: '2026-11-15',
});
