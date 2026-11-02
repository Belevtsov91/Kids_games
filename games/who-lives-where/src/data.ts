// Животные и их дома. Без DOM: этот файл импортирует и сервер игры (проверка id).

export interface Animal {
  id: string;
  name: string;
  emoji: string;
}

export interface Habitat {
  id: string;
  title: string;
  /** «Корова живёт …» — продолжение фразы для озвучки. */
  where: string;
  emoji: string;
  /** Чем меньше, тем раньше дом появляется в игре: сначала знакомое (ферма, лес), потом саванна и льды. */
  tier: 1 | 2 | 3;
  animals: Animal[];
}

export const habitats: Habitat[] = [
  {
    id: 'farm', title: 'Ферма', where: 'на ферме', emoji: '🚜', tier: 1,
    animals: [
      { id: 'cow', name: 'Корова', emoji: '🐄' },
      { id: 'pig', name: 'Свинка', emoji: '🐖' },
      { id: 'chicken', name: 'Курочка', emoji: '🐔' },
      { id: 'sheep', name: 'Овечка', emoji: '🐑' },
      { id: 'horse', name: 'Лошадка', emoji: '🐴' },
      { id: 'goat', name: 'Козочка', emoji: '🐐' },
    ],
  },
  {
    id: 'forest', title: 'Лес', where: 'в лесу', emoji: '🌲', tier: 1,
    animals: [
      { id: 'bear', name: 'Медведь', emoji: '🐻' },
      { id: 'fox', name: 'Лиса', emoji: '🦊' },
      { id: 'hedgehog', name: 'Ёжик', emoji: '🦔' },
      { id: 'squirrel', name: 'Белочка', emoji: '🐿️' },
      { id: 'wolf', name: 'Волк', emoji: '🐺' },
      { id: 'owl', name: 'Сова', emoji: '🦉' },
    ],
  },
  {
    id: 'sea', title: 'Море', where: 'в море', emoji: '🌊', tier: 1,
    animals: [
      { id: 'whale', name: 'Кит', emoji: '🐳' },
      { id: 'dolphin', name: 'Дельфин', emoji: '🐬' },
      { id: 'octopus', name: 'Осьминог', emoji: '🐙' },
      { id: 'fish', name: 'Рыбка', emoji: '🐠' },
      { id: 'crab', name: 'Краб', emoji: '🦀' },
    ],
  },
  {
    id: 'house', title: 'Дом', where: 'дома, с людьми', emoji: '🏠', tier: 1,
    animals: [
      { id: 'cat', name: 'Кошка', emoji: '🐈' },
      { id: 'dog', name: 'Собака', emoji: '🐕' },
      { id: 'hamster', name: 'Хомячок', emoji: '🐹' },
      { id: 'rabbit', name: 'Кролик', emoji: '🐇' },
    ],
  },
  {
    id: 'pond', title: 'Пруд', where: 'в пруду', emoji: '🪷', tier: 2,
    animals: [
      { id: 'frog', name: 'Лягушка', emoji: '🐸' },
      { id: 'duck', name: 'Уточка', emoji: '🦆' },
      { id: 'swan', name: 'Лебедь', emoji: '🦢' },
    ],
  },
  {
    id: 'jungle', title: 'Джунгли', where: 'в джунглях', emoji: '🌴', tier: 2,
    animals: [
      { id: 'monkey', name: 'Обезьянка', emoji: '🐒' },
      { id: 'tiger', name: 'Тигр', emoji: '🐅' },
      { id: 'parrot', name: 'Попугай', emoji: '🦜' },
      { id: 'snake', name: 'Змея', emoji: '🐍' },
      { id: 'sloth', name: 'Ленивец', emoji: '🦥' },
    ],
  },
  {
    id: 'savanna', title: 'Саванна', where: 'в саванне', emoji: '🌞', tier: 3,
    animals: [
      { id: 'lion', name: 'Лев', emoji: '🦁' },
      { id: 'giraffe', name: 'Жираф', emoji: '🦒' },
      { id: 'zebra', name: 'Зебра', emoji: '🦓' },
      { id: 'elephant', name: 'Слон', emoji: '🐘' },
      { id: 'rhino', name: 'Носорог', emoji: '🦏' },
    ],
  },
  {
    id: 'ice', title: 'Льды', where: 'среди льдов', emoji: '❄️', tier: 3,
    animals: [
      { id: 'polar-bear', name: 'Белый медведь', emoji: '🐻‍❄️' },
      { id: 'penguin', name: 'Пингвин', emoji: '🐧' },
      { id: 'seal', name: 'Тюлень', emoji: '🦭' },
    ],
  },
];

export const allAnimals: Animal[] = habitats.flatMap((h) => h.animals);
export const animalIds = new Set(allAnimals.map((a) => a.id));

const homeOf = new Map(habitats.flatMap((h) => h.animals.map((a) => [a.id, h] as const)));

export const habitatOf = (animalId: string): Habitat | undefined => homeOf.get(animalId);
