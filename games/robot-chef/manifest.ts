import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'robot-chef',
  title: 'Робот-поварёнок',
  titles: { uk: 'Робот-кухарчик', ro: 'Robotul bucătar', en: 'Robot Chef' },
  emoji: '🤖',
  kind: '2d',
  ages: { min: 4, max: 8 },
  skills: ['logic', 'space'],
  stickers: [
    { id: 'first-soup', emoji: '🍲', title: 'Первый суп', titles: { uk: 'Перший суп', ro: 'Prima supă', en: 'First soup' } },
    { id: 'loop-master', emoji: '🔁', title: 'Мастер повторов', titles: { uk: 'Майстер повторів', ro: 'Maestrul repetărilor', en: 'Loop master' } },
    { id: 'master-chef', emoji: '👨‍🍳', title: 'Шеф-повар', titles: { uk: 'Шеф-кухар', ro: 'Bucătar-șef', en: 'Master chef' } },
  ],
  about: 'Основы программирования: ребёнок составляет последовательность команд, проверяет её и исправляет ошибки.',
  abouts: {
    uk: 'Основи програмування: дитина складає послідовність команд, перевіряє її й виправляє помилки.',
    ro: 'Bazele programării: copilul alcătuiește o secvență de comenzi, o verifică și își corectează greșelile.',
    en: 'Coding basics: the child builds a sequence of commands, tests it and fixes mistakes.',
  },
  together: 'Попросите ребёнка сказать вслух, куда пойдёт робот, прежде чем нажать «Пуск». Ошибка — не провал, а повод вместе найти «баг».',
  togethers: {
    uk: 'Попросіть дитину сказати вголос, куди піде робот, перш ніж натиснути «Пуск». Помилка — не провал, а привід разом знайти «баг».',
    ro: 'Rugați copilul să spună cu voce tare unde va merge robotul înainte de „Start”. Greșeala nu e un eșec, ci un prilej să găsiți împreună „bugul”.',
    en: "Ask your child to say out loud where the robot will go before pressing Start. A mistake isn't a failure, it's a bug to find together.",
  },
});
