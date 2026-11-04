import type { Texts } from './ru';

export const uk: Texts = {
  speech: 'uk',
  title: 'Майстерня фігур',
  lead: (name?: string) => (name ? `${name}, склади картинку з фігур!` : 'Склади картинку з фігур!'),
  pictures: 'Картинки',
  free: '🎨 Своя картинка',
  back: '‹ Назад',
  next: 'Далі ▶',
  menu: '🏠 Картинки',
  clear: '🗑 Очистити',
  freeTip: 'Натисни на фігуру — вона з’явиться. Рухай пальцем, натисни ще раз — зміниться колір. Витягни за край — прибереться.',
  shapes: { circle: 'коло', oval: 'овал', square: 'квадрат', rect: 'прямокутник', triangle: 'трикутник', semicircle: 'півколо', star: 'зірка' },
  names: {
    house: 'Будиночок', tree: 'Ялинка', snowman: 'Сніговик', fish: 'Рибка', rocket: 'Ракета',
    car: 'Машинка', boat: 'Кораблик', cat: 'Котик', robot: 'Робот', castle: 'Замок',
  },
  sayStart: 'Перетягни фігури на їхні місця. Можна натиснути на фігуру, а потім на місце.',
  sayNeed: (need: string, have: string) => `Це ${have}. А тут потрібен ${need}.`,
  sayPlaced: (shape: string) => shape,
  sayDone: (name: string) => `Ура! Вийшла картинка: ${name.toLowerCase()}!`,
  bravo: 'Вийшло!',
  sayEnding: 'Скоро відпочинок. Спокійно завершимо.',
};
