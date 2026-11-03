import art0 from '../../assets/characters/cow.svg';
import art1 from '../../assets/characters/pig.svg';
import art2 from '../../assets/characters/chicken.svg';
import art3 from '../../assets/characters/sheep.svg';
import art4 from '../../assets/characters/horse.svg';
import art5 from '../../assets/characters/goat.svg';
import art6 from '../../assets/characters/bear.svg';
import art7 from '../../assets/characters/fox.svg';
import art8 from '../../assets/characters/hedgehog.svg';
import art9 from '../../assets/characters/squirrel.svg';
import art10 from '../../assets/characters/wolf.svg';
import art11 from '../../assets/characters/owl.svg';
import art12 from '../../assets/characters/whale.svg';
import art13 from '../../assets/characters/dolphin.svg';
import art14 from '../../assets/characters/octopus.svg';
import art15 from '../../assets/characters/fish.svg';
import art16 from '../../assets/characters/crab.svg';
import art17 from '../../assets/characters/cat.svg';
import art18 from '../../assets/characters/dog.svg';
import art19 from '../../assets/characters/hamster.svg';
import art20 from '../../assets/characters/rabbit.svg';
import art21 from '../../assets/characters/frog.svg';
import art22 from '../../assets/characters/duck.svg';
import art23 from '../../assets/characters/swan.svg';
import art24 from '../../assets/characters/monkey.svg';
import art25 from '../../assets/characters/tiger.svg';
import art26 from '../../assets/characters/parrot.svg';
import art27 from '../../assets/characters/snake.svg';
import art28 from '../../assets/characters/sloth.svg';
import art29 from '../../assets/characters/lion.svg';
import art30 from '../../assets/characters/giraffe.svg';
import art31 from '../../assets/characters/zebra.svg';
import art32 from '../../assets/characters/elephant.svg';
import art33 from '../../assets/characters/rhino.svg';
import art34 from '../../assets/characters/polar-bear.svg';
import art35 from '../../assets/characters/penguin.svg';
import art36 from '../../assets/characters/seal.svg';
export const animalArt: Record<string, string> = {
  'cow': art0,
  'pig': art1,
  'chicken': art2,
  'sheep': art3,
  'horse': art4,
  'goat': art5,
  'bear': art6,
  'fox': art7,
  'hedgehog': art8,
  'squirrel': art9,
  'wolf': art10,
  'owl': art11,
  'whale': art12,
  'dolphin': art13,
  'octopus': art14,
  'fish': art15,
  'crab': art16,
  'cat': art17,
  'dog': art18,
  'hamster': art19,
  'rabbit': art20,
  'frog': art21,
  'duck': art22,
  'swan': art23,
  'monkey': art24,
  'tiger': art25,
  'parrot': art26,
  'snake': art27,
  'sloth': art28,
  'lion': art29,
  'giraffe': art30,
  'zebra': art31,
  'elephant': art32,
  'rhino': art33,
  'polar-bear': art34,
  'penguin': art35,
  'seal': art36,
};

export function animalImage(id: string, className = '') {
  const img = document.createElement('img');
  img.src = animalArt[id];
  img.alt = '';
  img.draggable = false;
  img.className = className;
  return img;
}
