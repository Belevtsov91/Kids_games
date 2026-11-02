export interface PuzzleImage {
  id: string;
  title: string;
  imageUrl: string;
  width: number;
  height: number;
  sourceUrl: string;
}

/**
 * Стартовый набор. Изображения взяты из открытой коллекции AI Scribbles;
 * ссылка на источник сохранена у каждой карточки.
 */
export const starterPuzzles: PuzzleImage[] = [
  {
    id: 'rainbow-cat',
    title: 'Радужный котик',
    imageUrl: 'https://images.aiscribbles.com/0f28660275234cd38b68e9ecd16fd65b.jpg?v=54efef',
    width: 1024,
    height: 1024,
    sourceUrl: 'https://www.aiscribbles.com/img/45149/colorful-cartoon-cat/',
  },
  {
    id: 'turtle',
    title: 'Черепашка',
    imageUrl: 'https://images.aiscribbles.com/fc6ade0f496e4e1c8b2e3bde35788255.png?v=7a47b2',
    width: 1024,
    height: 1024,
    sourceUrl: 'https://www.aiscribbles.com/img/11884/colorful-cartoon-turtle/',
  },
];
