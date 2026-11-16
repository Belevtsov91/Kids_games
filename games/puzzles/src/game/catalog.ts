import house from '../../assets/house.svg';
import fish from '../../assets/fish.svg';
import rocket from '../../assets/rocket.svg';
import turtleBakery from '../../assets/turtle-bakery.webp';
import moonGarden from '../../assets/moon-garden.webp';
import forestConcert from '../../assets/forest-concert.webp';
import cometGreenhouse from '../../assets/comet-greenhouse.webp';
import rainbowCat from '../../assets/rainbow-cat.svg';
import turtle from '../../assets/turtle.svg';

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
 * Стартовый набор. Все картинки лежат в папке игры: работают без интернета
 * и не отправляют запросы чужим сайтам.
 */
export const starterPuzzles: PuzzleImage[] = [
  { id: 'turtle-bakery', title: 'Пекарня на спине черепахи', imageUrl: turtleBakery, width: 1536, height: 1024 },
  { id: 'moon-garden', title: 'Лунный сад', imageUrl: moonGarden, width: 1536, height: 1024 },
  { id: 'forest-concert', title: 'Лесной концерт', imageUrl: forestConcert, width: 1536, height: 1024 },
  { id: 'comet-greenhouse', title: 'Космическая оранжерея', imageUrl: cometGreenhouse, width: 1536, height: 1024 },
  { id: 'house', title: 'Домик и радуга', imageUrl: house, width: 1024, height: 1024 },
  { id: 'fish', title: 'Рыбка', imageUrl: fish, width: 1024, height: 1024 },
  { id: 'rocket', title: 'Ракета', imageUrl: rocket, width: 1024, height: 1024 },
  { id: 'rainbow-cat', title: 'Радужный котик', imageUrl: rainbowCat, width: 1024, height: 1024 },
  { id: 'turtle', title: 'Черепашка', imageUrl: turtle, width: 1024, height: 1024 },
];
