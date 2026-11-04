import type { Texts } from './ru';

export const en: Texts = {
  speech: 'en',
  title: 'Shape Workshop',
  lead: (name?: string) => (name ? `${name}, build a picture from shapes!` : 'Build a picture from shapes!'),
  pictures: 'Pictures',
  free: '🎨 My picture',
  back: '‹ Back',
  next: 'Next ▶',
  menu: '🏠 Pictures',
  clear: '🗑 Clear',
  freeTip: 'Tap a shape to add it. Drag to move, tap again to change colour. Drag it off the edge to remove it.',
  shapes: { circle: 'circle', oval: 'oval', square: 'square', rect: 'rectangle', triangle: 'triangle', semicircle: 'semicircle', star: 'star' },
  names: {
    house: 'House', tree: 'Tree', snowman: 'Snowman', fish: 'Fish', rocket: 'Rocket',
    car: 'Car', boat: 'Boat', cat: 'Cat', robot: 'Robot', castle: 'Castle',
  },
  sayStart: 'Drag the shapes to their places. You can also tap a shape, then tap its place.',
  sayNeed: (need: string, have: string) => `That's a ${have}. This place needs a ${need}.`,
  sayPlaced: (shape: string) => shape,
  sayDone: (name: string) => `Hooray! You made a ${name.toLowerCase()}!`,
  bravo: 'You did it!',
  sayEnding: "It's almost rest time. Let's finish calmly.",
};
