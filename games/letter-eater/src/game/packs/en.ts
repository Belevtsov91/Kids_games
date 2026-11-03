// Буквы и слова: English.
import type { LanguagePack } from './types';

export const en: LanguagePack = {
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  similar: {
    A: 'HV', B: 'DPR', C: 'GO', D: 'BPQ', E: 'FB', F: 'EP', G: 'CQ', H: 'NA', I: 'LJ', J: 'IL',
    K: 'XH', L: 'IT', M: 'NW', N: 'MH', O: 'QC', P: 'BRQ', Q: 'OPG', R: 'PB', S: 'ZC', T: 'FL',
    U: 'VN', V: 'UY', W: 'MV', X: 'KZ', Y: 'VX', Z: 'SN',
  },
  letterNames: {
    A: 'ay', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'eff', G: 'gee', H: 'aitch', I: 'eye', J: 'jay',
    K: 'kay', L: 'el', M: 'em', N: 'en', O: 'oh', P: 'pee', Q: 'cue', R: 'ar', S: 'ess', T: 'tee',
    U: 'you', V: 'vee', W: 'double you', X: 'ex', Y: 'why', Z: 'zed',
  },
  levels: [
    {
      title: 'First words',
      words: [
        { word: 'CAT', emoji: '🐱', art: 'КОТ' }, { word: 'DOG', emoji: '🐶' }, { word: 'SUN', emoji: '☀️' }, { word: 'BUS', emoji: '🚌' },
        { word: 'BEE', emoji: '🐝' }, { word: 'COW', emoji: '🐄' }, { word: 'PIG', emoji: '🐷' }, { word: 'FOX', emoji: '🦊', art: 'ЛИСА' },
        { word: 'OWL', emoji: '🦉', art: 'СОВА' }, { word: 'HAT', emoji: '🎩' }, { word: 'CAR', emoji: '🚗' }, { word: 'EGG', emoji: '🥚' },
        { word: 'BED', emoji: '🛏️' }, { word: 'CUP', emoji: '☕' },
      ],
    },
    {
      title: 'Four letters',
      words: [
        { word: 'MOON', emoji: '🌙', art: 'ЛУНА' }, { word: 'FISH', emoji: '🐟', art: 'РЫБА' }, { word: 'CAKE', emoji: '🎂' }, { word: 'GOAT', emoji: '🐐' },
        { word: 'FROG', emoji: '🐸' }, { word: 'DUCK', emoji: '🦆' }, { word: 'LION', emoji: '🦁' }, { word: 'BEAR', emoji: '🐻' },
        { word: 'ROSE', emoji: '🌹' }, { word: 'STAR', emoji: '⭐' }, { word: 'BOOK', emoji: '📚' }, { word: 'KITE', emoji: '🪁' },
        { word: 'TREE', emoji: '🌳' }, { word: 'BALL', emoji: '⚽' },
      ],
    },
    {
      title: 'Harder words',
      words: [
        { word: 'ZEBRA', emoji: '🦓' }, { word: 'KOALA', emoji: '🐨' }, { word: 'PANDA', emoji: '🐼' }, { word: 'TRAIN', emoji: '🚂' },
        { word: 'LEMON', emoji: '🍋' }, { word: 'TIGER', emoji: '🐯' }, { word: 'MOUSE', emoji: '🐭' }, { word: 'HORSE', emoji: '🐴' },
        { word: 'SHEEP', emoji: '🐑' }, { word: 'APPLE', emoji: '🍎' }, { word: 'CLOUD', emoji: '☁️' }, { word: 'SNAKE', emoji: '🐍' },
        { word: 'WHALE', emoji: '🐳' }, { word: 'HOUSE', emoji: '🏠' },
      ],
    },
    {
      title: 'Long words',
      words: [
        { word: 'RABBIT', emoji: '🐰', art: 'ЗАЯЦ' }, { word: 'ROCKET', emoji: '🚀' }, { word: 'FLOWER', emoji: '🌷' }, { word: 'CARROT', emoji: '🥕', art: 'МОРКОВЬ' },
        { word: 'PENGUIN', emoji: '🐧', art: 'ПИНГВИН' }, { word: 'DOLPHIN', emoji: '🐬', art: 'ДЕЛЬФИН' }, { word: 'GIRAFFE', emoji: '🦒' }, { word: 'MONKEY', emoji: '🐒' },
        { word: 'CASTLE', emoji: '🏰' }, { word: 'BANANA', emoji: '🍌' }, { word: 'PARROT', emoji: '🦜' }, { word: 'TURTLE', emoji: '🐢', art: 'ЧЕРЕПАХА' },
        { word: 'PUMPKIN', emoji: '🎃' },
      ],
    },
    {
      title: 'Champion',
      words: [
        { word: 'BUTTERFLY', emoji: '🦋' }, { word: 'ELEPHANT', emoji: '🐘', art: 'СЛОН' }, { word: 'DINOSAUR', emoji: '🦕' }, { word: 'CROCODILE', emoji: '🐊' },
        { word: 'PINEAPPLE', emoji: '🍍' }, { word: 'SUNFLOWER', emoji: '🌻' }, { word: 'KANGAROO', emoji: '🦘' }, { word: 'HEDGEHOG', emoji: '🦔' },
        { word: 'SAILBOAT', emoji: '⛵' }, { word: 'UMBRELLA', emoji: '☂️' }, { word: 'FLAMINGO', emoji: '🦩' }, { word: 'BROCCOLI', emoji: '🥦' },
      ],
    },
  ],
};
