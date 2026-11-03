// Тексты: русский (образец формы для остальных языков).
export const ru = {
  speech: 'ru',
  title: 'Мастерская фигур',
  lead: (name?: string) => (name ? `${name}, собери картинку из фигур!` : 'Собери картинку из фигур!'),
  pictures: 'Картинки',
  free: '🎨 Своя картинка',
  back: '‹ Назад',
  next: 'Дальше ▶',
  menu: '🏠 Картинки',
  clear: '🗑 Очистить',
  freeTip: 'Нажми на фигуру — она появится. Двигай пальцем, нажми ещё раз — сменится цвет. Утащи за край — уберётся.',
  shapes: { circle: 'круг', oval: 'овал', square: 'квадрат', rect: 'прямоугольник', triangle: 'треугольник', semicircle: 'полукруг', star: 'звезда' } as Record<string, string>,
  names: {
    house: 'Домик', tree: 'Ёлочка', snowman: 'Снеговик', fish: 'Рыбка', rocket: 'Ракета',
    car: 'Машинка', boat: 'Кораблик', cat: 'Котик', robot: 'Робот', castle: 'Замок',
  } as Record<string, string>,
  sayStart: 'Перетащи фигуры на их места. Можно нажать на фигуру, а потом на место.',
  sayNeed: (need: string, have: string) => `Это ${have}. А здесь нужен ${need}.`,
  sayPlaced: (shape: string) => shape,
  sayDone: (name: string) => `Ура! Получился ${name.toLowerCase()}!`,
  bravo: 'Получилось!',
  sayEnding: 'Скоро отдых. Давай спокойно закончим.',
};

export type Texts = typeof ru;
