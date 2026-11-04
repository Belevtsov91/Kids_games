import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'moon-valley',
  title: 'Хранители Лунной Долины',
  titles: { uk: 'Охоронці Місячної Долини', ro: 'Paznicii Văii Lunii', en: 'Keepers of Moon Valley' },
  emoji: '🌙',
  kind: '3d',
  ages: { min: 7, max: 15 },
  skills: ['nature', 'logic'],
  stickers: [
    { id: 'first-harvest', emoji: '🌽', title: 'Первый урожай', titles: { uk: 'Перший урожай', ro: 'Prima recoltă', en: 'First harvest' } },
    { id: 'first-quest', emoji: '📜', title: 'Первое задание', titles: { uk: 'Перше завдання', ro: 'Prima misiune', en: 'First quest' } },
    { id: 'valley-keeper', emoji: '🌙', title: 'Хранитель долины', titles: { uk: 'Охоронець долини', ro: 'Paznicul văii', en: 'Valley keeper' } },
  ],
  about: 'Длинное приключение с заданиями: ребёнок планирует шаги, ухаживает за грядками и питомцами, доводит дело до конца.',
  abouts: {
    uk: 'Довга пригода із завданнями: дитина планує кроки, доглядає грядки й улюбленців, доводить справу до кінця.',
    ro: 'O aventură lungă cu misiuni: copilul își planifică pașii, îngrijește straturile și animăluțele și duce lucrurile la capăt.',
    en: 'A long quest adventure: your child plans steps, tends crops and pets, and sees tasks through to the end.',
  },
  together: 'Спросите, какое задание сейчас и что для него нужно. Пусть ребёнок расскажет план, прежде чем бежать.',
  togethers: {
    uk: 'Запитайте, яке зараз завдання і що для нього треба. Хай дитина розкаже план, перш ніж бігти.',
    ro: 'Întrebați care e misiunea acum și ce trebuie pentru ea. Lăsați copilul să spună planul înainte să pornească.',
    en: 'Ask which quest is active and what it needs. Let your child tell you the plan before setting off.',
  },
  tagline: '3D-приключение: квесты, свой питомец, смена дня и ночи.',
  taglines: { uk: '3D-пригода: квести, свій улюбленець, зміна дня і ночі.', ro: 'Aventură 3D: misiuni, un animăluț al tău, zi și noapte.', en: 'A 3D adventure with quests, a pet and day and night.' },
  color: '#b7a6ff',
});
