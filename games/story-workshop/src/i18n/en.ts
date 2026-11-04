// Texts: English.
import type { Words } from '../game/tell';
import type { Texts } from './ru';

const words: Words = {
  heroes: {
    bunny: { name: 'Bunny', a: 'a little bunny', the: 'the bunny' },
    hedgehog: { name: 'Hedgehog', a: 'a hedgehog', the: 'the hedgehog' },
    dragon: { name: 'Dragon', a: 'a baby dragon', the: 'the dragon' },
    kitten: { name: 'Kitten', a: 'a kitten', the: 'the kitten' },
    robot: { name: 'Robot', a: 'a robot', the: 'the robot' },
    bear: { name: 'Bear cub', a: 'a bear cub', the: 'the bear cub' },
  },
  places: {
    forest: { name: 'Forest', to: 'to the magic forest' },
    sea: { name: 'Sea', to: 'to the blue sea' },
    space: { name: 'Space', to: 'into faraway space' },
    castle: { name: 'Castle', to: 'to an old castle' },
    mountains: { name: 'Mountains', to: 'to the high mountains' },
    city: { name: 'City', to: 'to the big city' },
  },
  twists: {
    rain: { name: 'Rain', line: 'Suddenly heavy rain began, and everything got wet and cold.' },
    lost: { name: 'Lost', line: 'But the road got tangled, and it was hard to know the way.' },
    dark: { name: 'Darkness', line: 'Then night came, and it got very dark.' },
    friend: { name: 'Sad friend', line: 'On the way it met a sad friend who felt lonely.' },
    river: { name: 'River', line: 'Ahead was a wide river with no bridge.' },
    wind: { name: 'Wind', line: 'Suddenly the wind blew so hard it took the hat away!' },
  },
  items: {
    lamp: { name: 'Lamp', use: 'switched on the magic lamp' },
    umbrella: { name: 'Umbrella', use: 'opened the big umbrella' },
    map: { name: 'Map', use: 'took out the old map' },
    pipe: { name: 'Pipe', use: 'played the magic pipe' },
    pie: { name: 'Pie', use: 'shared a tasty pie' },
    key: { name: 'Key', use: 'found the golden key' },
  },
  begin: (a, to) => `Once upon a time there was ${a}. One day it set off ${to}.`,
  end: (the, use) => `Then ${the} ${use}, and everything ended well!`,
};

export const en: Texts = {
  speech: 'en',
  title: 'Story Workshop',
  lead: (name?: string) => (name ? `${name}, let's make up a story!` : "Let's make up a story!"),
  newTale: '✨ New story',
  shelf: (n: number) => `📚 My stories: ${n}`,
  surprise: '🎲 Surprise me',
  step: (n: number) => `Step ${n} of 4`,
  ask: { hero: 'Who is the hero?', place: 'Where does it go?', twist: 'What happened on the way?', item: 'What helped?' },
  tellAsk: ['Tell how it all began.', 'What happened next?', 'How did it end?'],
  hint: '🔊 Hint',
  told: 'I told it! ▶',
  done: 'The story is ready!',
  readAll: '📖 Read the story',
  home: '🏠 To the workshop',
  back: '◀ Back',
  and: 'and',
  empty: 'Your stories will live here.',
  coach: 'For the grown-up: ask “What if…?” and let the child finish the story.',
  sayDone: 'What a wonderful story! I will put it on the shelf.',
  sayEnding: 'Break time soon. Let’s finish the story.',
  words,
};
