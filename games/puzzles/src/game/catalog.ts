import house from '../../assets/house.svg';
import fish from '../../assets/fish.svg';
import rocket from '../../assets/rocket.svg';
import turtleBakery from '../../assets/turtle-bakery.webp';
import moonGarden from '../../assets/moon-garden.webp';
import forestConcert from '../../assets/forest-concert.webp';
import cometGreenhouse from '../../assets/comet-greenhouse.webp';

export interface PuzzleImage {
  id: string;
  title: string;
  imageUrl: string;
  width: number;
  height: number;
  /** Откуда картинка; у встроенных картинок нет. */
  sourceUrl?: string;
}

/**
 * Стартовый набор. Первые три картинки лежат в папке игры и работают без интернета;
 * остальные — из открытой коллекции AI Scribbles (если не загрузились, карточка скрывается).
 */
export const starterPuzzles: PuzzleImage[] = [
  { id: 'turtle-bakery', title: 'Пекарня на спине черепахи', imageUrl: turtleBakery, width: 1536, height: 1024 },
  { id: 'moon-garden', title: 'Лунный сад', imageUrl: moonGarden, width: 1536, height: 1024 },
  { id: 'forest-concert', title: 'Лесной концерт', imageUrl: forestConcert, width: 1536, height: 1024 },
  { id: 'comet-greenhouse', title: 'Космическая оранжерея', imageUrl: cometGreenhouse, width: 1536, height: 1024 },
  { id: 'house', title: 'Домик и радуга', imageUrl: house, width: 1024, height: 1024 },
  { id: 'fish', title: 'Рыбка', imageUrl: fish, width: 1024, height: 1024 },
  { id: 'rocket', title: 'Ракета', imageUrl: rocket, width: 1024, height: 1024 },
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
