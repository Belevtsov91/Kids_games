// Тексты витрины игр: English.
import type { ShowcaseCopy, ShowcaseId } from '../showcase';

export const en: Record<ShowcaseId, ShowcaseCopy> = {
  'moon-valley': {
    title: 'Keepers of Moon Valley',
    short: 'Moon Valley',
    text: 'A big 3D adventure. A village, garden beds and a greenhouse, quests in your journal, the Mushroom King in the northern glade and Luna the fox you can pet. There is day and night.',
    card: 'A 3D adventure with quests, a pet and day and night.',
    tags: ['Quests', 'Pet', 'Day and night'],
    shotAlts: ['The village in Moon Valley', 'Moon Valley at night'],
    benefit: 'Reading tasks, planning, caring for a pet and a garden.',
  },
  'island-builder': {
    title: 'Island Builder',
    text: 'Build an island from blocks: dig a bay, plant trees, put up lanterns, launch boats. Quests like “Build a tower 11 blocks tall”.',
    card: 'Blocks, trees, boats and lanterns. Your own island with quests.',
    tags: ['Blocks', 'Boats', 'Quests'],
    benefit: 'Spatial thinking, counting blocks, finishing what you start.',
  },
  playground3d: {
    title: '3D Sandbox',
    text: 'Toys with real physics: stacking rings, cubes and balls. Throw, build and knock things over as much as you like.',
    card: 'Stacking rings, cubes and balls with real physics.',
    tags: ['Physics', 'Toys', 'No rules'],
    benefit: 'How things fall and roll: first experiments with physics.',
  },
  'space-gardener': {
    title: 'Space Gardener',
    text: 'Draw a vine with your finger from the comet to the pot and water the flower. Black holes, asteroids and low gravity get in the water’s way.',
    card: 'Draw a vine from the comet to the pot and water the flower.',
    tags: ['Puzzle', 'Draw with a finger', '3 stars'],
    benefit: 'Logic and trajectories: how to guide water around obstacles.',
  },
  drawing: { title: 'Drawing', text: 'Draw with your finger or a mouse: brushes, colours, stamps.', tags: ['Creativity'], benefit: 'Fine motor skills, colours, imagination.' },
  puzzles: { title: 'Puzzles', text: 'Put pictures together from pieces, from easy to hard.', tags: ['Logic'], benefit: 'Attention, shapes, patience.' },
  'letter-eater': { title: 'Letter Eater', text: 'Feed the Letter Eater the right letters and learn the alphabet.', tags: ['Letters'], benefit: 'Letters and first words.' },
  'animal-orchestra': { title: 'Animal Orchestra', text: 'The animals play music and you conduct.', tags: ['Music'], benefit: 'Rhythm, sounds and animal voices.' },
  counting: {
    title: 'Count & play',
    text: 'Counting in four languages: English, Russian, Ukrainian, Romanian.',
    tags: ['Numbers', '4 languages'],
    benefit: 'Counting and numbers in English, Russian, Ukrainian and Romanian.',
  },
  'who-lives-where': { title: 'Who Lives Where', text: 'Help the little animals find their homes.', tags: ['Animals'], benefit: 'Animals and their homes, sorting.' },
};
