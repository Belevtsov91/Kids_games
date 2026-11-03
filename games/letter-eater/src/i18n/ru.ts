// Тексты: русский (образец формы для остальных языков).
export const ru = {
  /** Язык голоса браузера и подсказка, какой голос выбрать. */
  speech: 'ru-RU',
  voiceHint: /female|irina|milena|светлана|ирина/i,
  title: 'Буквоед',
  feedMe: (name?: string) => (name ? `${name}, покорми меня буквами!` : 'Покорми меня буквами!'),
  exit: 'Выйти из игры',
  totalStars: (n: number) => `Всего звёзд: ${n}`,
  loginNote: 'Войдите в профиль, чтобы звёзды сохранялись',
  level: (id: number, title: string, open: boolean) => `Уровень ${id}: ${title}${open ? '' : ', закрыт'}`,
  starsOf: (n: number) => `${n} из 3 звёзд`,
  levelDone: 'Уровень пройден',
  ate: (n: number) => `Монстрик съел ${n} слов!`,
  unlocked: (title: string) => `Открыт уровень «${title}»`,
  retry: '↻ Ещё раз',
  next: 'Дальше →',
  toLevels: 'К уровням',
  allLevels: 'Все уровни',
  letters: 'Буквы',
  listen: 'Послушать слово',
  progress: (n: number, of: number) => `Слово ${n} из ${of}`,
  hint: 'Подсказка',
  letter: (l: string) => `Буква ${l}`,
  praise: ['Ням-ням!', 'Вкусно!', 'Молодец!', 'Ура!', 'Здорово!', 'Супер!', 'Отлично!'],
  hungry: 'Ням-ням! Хочу буквы!',
  winTitle: (stars: number): string => (stars === 3 ? 'Идеально!' : stars === 2 ? 'Отлично!' : 'Получилось!'),
  winSay: (title: string, name?: string) => (name ? `${title} ${name}, ты молодец!` : `${title} Ты молодец!`),
};

export type Texts = typeof ru;
