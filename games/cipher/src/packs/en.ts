// Pack: English.
import { LATIN } from '../game/morse';
import type { Pack } from './types';

export const en: Pack = {
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  morse: LATIN,
  words: [
    { word: 'CAT', emoji: '🐱' },
    { word: 'DOG', emoji: '🐶' },
    { word: 'SUN', emoji: '☀️' },
    { word: 'OWL', emoji: '🦉' },
    { word: 'BEE', emoji: '🐝' },
    { word: 'FISH', emoji: '🐟' },
    { word: 'MOON', emoji: '🌙' },
    { word: 'STAR', emoji: '⭐' },
    { word: 'BOAT', emoji: '⛵' },
    { word: 'HOUSE', emoji: '🏠' },
    { word: 'APPLE', emoji: '🍎' },
    { word: 'TRAIN', emoji: '🚂' },
    { word: 'LETTER', emoji: '✉️' },
    { word: 'CASTLE', emoji: '🏰' },
    { word: 'ROCKET', emoji: '🚀' },
    { word: 'ISLAND', emoji: '🏝️' },
  ],
  riddles: [
    {
      question: 'Tyopa’s dad has three sons: Pyh, Pah and… What is the third son’s name?',
      choices: [{ text: 'Tyopa', emoji: '🐻' }, { text: 'Poh', emoji: '🐼' }, { text: 'Puh', emoji: '🧸' }, { text: 'Peh', emoji: '🐨' }],
    },
    {
      question: 'Continue the pattern: 2, 4, 8, 16, …',
      choices: [{ text: '32', emoji: '🔢' }, { text: '24', emoji: '🔢' }, { text: '18', emoji: '🔢' }, { text: '20', emoji: '🔢' }],
    },
    {
      question: 'Every letter is moved one step forward: DBU. What is the word?',
      choices: [{ text: 'CAT', emoji: '🐱' }, { text: 'BAT', emoji: '🦇' }, { text: 'CUT', emoji: '✂️' }, { text: 'COT', emoji: '🛏️' }],
    },
    {
      question: 'How many months of the year have 28 days?',
      choices: [{ text: 'All 12', emoji: '📅' }, { text: 'One', emoji: '1️⃣' }, { text: 'Two', emoji: '2️⃣' }, { text: 'None', emoji: '0️⃣' }],
    },
    {
      question: 'What belongs to you, but other people use it more than you do?',
      choices: [{ text: 'Your name', emoji: '🏷️' }, { text: 'Toothbrush', emoji: '🪥' }, { text: 'Shadow', emoji: '👤' }, { text: 'Hat', emoji: '🧢' }],
    },
    {
      question: 'The more you take from it, the bigger it gets. What is it?',
      choices: [{ text: 'A hole', emoji: '🕳️' }, { text: 'A basket', emoji: '🧺' }, { text: 'A river', emoji: '🌊' }, { text: 'A piggy bank', emoji: '🐷' }],
    },
    {
      question: 'Which number grows by 3 when you turn it upside down?',
      choices: [{ text: '6', emoji: '🙃' }, { text: '8', emoji: '🔢' }, { text: '1', emoji: '🔢' }, { text: '0', emoji: '🔢' }],
    },
    {
      question: 'What runs but never moves from its place?',
      choices: [{ text: 'A clock', emoji: '⏰' }, { text: 'Rain', emoji: '🌧️' }, { text: 'A train', emoji: '🚂' }, { text: 'A snail', emoji: '🐌' }],
    },
    {
      question: 'In Morse code “•••” is S and “———” is O. What does “••• ——— •••” mean?',
      choices: [{ text: 'SOS, help!', emoji: '🆘' }, { text: 'Hello', emoji: '👋' }, { text: 'Good night', emoji: '🌙' }, { text: 'All good', emoji: '👍' }],
    },
    {
      question: 'It has no hands and no feet, yet it opens the gate. Who is it?',
      choices: [{ text: 'The wind', emoji: '🌬️' }, { text: 'A cat', emoji: '🐱' }, { text: 'A key', emoji: '🔑' }, { text: 'Snow', emoji: '❄️' }],
    },
  ],
};
