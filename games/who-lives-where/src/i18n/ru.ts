// Тексты: русский (образец формы для остальных языков).
export const ru = {
  /** Начало кода языка голоса для озвучки. */
  speech: 'ru',
  lead: (name?: string) => (name ? `${name}, помоги зверятам найти свой дом!` : 'Помоги зверятам найти свой дом!'),
  play: '▶ Играть',
  album: '📖 Альбом зверят',
  back: '‹ Назад',
  notFound: 'Ещё не найден',
  win: 'Победа',
  next: 'Дальше ▶',
  menu: '🏠 Меню',
  bravo: 'Молодец!',
  allHome: 'Все зверята дома',
  homeCount: (n: number, of: number) => `Дома ${n} из ${of}`,
  tray: 'Зверята',
  title: 'Кто где живёт?',
  roundTitle: 'Отведи зверят домой!',
  level: (n: number) => `Уровень ${n}`,
  albumTitle: 'Альбом зверят',
  found: (n: number, of: number) => `${n} из ${of}`,
  sayUnknown: 'Этого зверька ты ещё не встречал. Играй, и он найдётся!',
  sayLives: (name: string, where: string) => `${name} живёт ${where}`,
  sayWin: 'Ура! Все зверята дома! Молодец!',
  sayAsk: (name: string) => `${name}. Где живёт ${name.toLowerCase()}?`,
  sayHelp: 'Помоги зверятам найти свой дом!',
  sayWrong: (name: string) => `Ой, не здесь! Где живёт ${name.toLowerCase()}?`,
  homes: {
    farm: ['Ферма', 'на ферме'], forest: ['Лес', 'в лесу'], sea: ['Море', 'в море'], house: ['Дом', 'дома, с людьми'],
    pond: ['Пруд', 'в пруду'], jungle: ['Джунгли', 'в джунглях'], savanna: ['Саванна', 'в саванне'], ice: ['Льды', 'среди льдов'],
  } as Record<string, [string, string]>,
  animals: {
    cow: 'Корова', pig: 'Свинка', chicken: 'Курочка', sheep: 'Овечка', horse: 'Лошадка', goat: 'Козочка',
    bear: 'Медведь', fox: 'Лиса', hedgehog: 'Ёжик', squirrel: 'Белочка', wolf: 'Волк', owl: 'Сова',
    whale: 'Кит', dolphin: 'Дельфин', octopus: 'Осьминог', fish: 'Рыбка', crab: 'Краб',
    cat: 'Кошка', dog: 'Собака', hamster: 'Хомячок', rabbit: 'Кролик',
    frog: 'Лягушка', duck: 'Уточка', swan: 'Лебедь',
    monkey: 'Обезьянка', tiger: 'Тигр', parrot: 'Попугай', snake: 'Змея', sloth: 'Ленивец',
    lion: 'Лев', giraffe: 'Жираф', zebra: 'Зебра', elephant: 'Слон', rhino: 'Носорог',
    'polar-bear': 'Белый медведь', penguin: 'Пингвин', seal: 'Тюлень',
  } as Record<string, string>,
};

export type Texts = typeof ru;
