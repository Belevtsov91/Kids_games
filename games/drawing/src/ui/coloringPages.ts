import page0 from '../../assets/coloring-pages/dragon-garden.svg';
import thumb0 from '../../assets/coloring-pages/dragon-garden.webp';
import page1 from '../../assets/coloring-pages/turtle-island.svg';
import thumb1 from '../../assets/coloring-pages/turtle-island.webp';
import page2 from '../../assets/coloring-pages/space-cat.svg';
import thumb2 from '../../assets/coloring-pages/space-cat.webp';
import page3 from '../../assets/coloring-pages/forest-post.svg';
import thumb3 from '../../assets/coloring-pages/forest-post.webp';
import page4 from '../../assets/coloring-pages/flower-city.svg';
import thumb4 from '../../assets/coloring-pages/flower-city.webp';
import page5 from '../../assets/coloring-pages/ocean-friends.svg';
import thumb5 from '../../assets/coloring-pages/ocean-friends.webp';
export const coloringPages = [
  { id: 'dragon-garden', title: 'Дракон в саду', src: page0, thumbnail: thumb0 },
  { id: 'turtle-island', title: 'Остров на спине черепахи', src: page1, thumbnail: thumb1 },
  { id: 'space-cat', title: 'Космический кот', src: page2, thumbnail: thumb2 },
  { id: 'forest-post', title: 'Лесная почта', src: page3, thumbnail: thumb3 },
  { id: 'flower-city', title: 'Цветочный город', src: page4, thumbnail: thumb4 },
  { id: 'ocean-friends', title: 'Океан друзей', src: page5, thumbnail: thumb5 },
];
export type ColoringPage = (typeof coloringPages)[number];
