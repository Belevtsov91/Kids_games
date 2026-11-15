// Set: română. Cuvintele pentru cifru sunt fără diacritice, ca să încapă pe roata de 26 de litere.
import { LATIN } from '../game/morse';
import type { Pack } from './types';

export const ro: Pack = {
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  morse: LATIN,
  words: [
    { word: 'URS', emoji: '🐻' },
    { word: 'LUP', emoji: '🐺' },
    { word: 'NOR', emoji: '☁️' },
    { word: 'CAL', emoji: '🐴' },
    { word: 'LEU', emoji: '🦁' },
    { word: 'MARE', emoji: '🌊' },
    { word: 'TREN', emoji: '🚂' },
    { word: 'PLIC', emoji: '✉️' },
    { word: 'STEA', emoji: '⭐' },
    { word: 'LAPTE', emoji: '🥛' },
    { word: 'AVION', emoji: '✈️' },
    { word: 'COPAC', emoji: '🌳' },
    { word: 'MINGE', emoji: '⚽' },
    { word: 'SOARE', emoji: '☀️' },
    { word: 'FLOARE', emoji: '🌸' },
    { word: 'CASTEL', emoji: '🏰' },
  ],
  riddles: [
    {
      question: 'Tatăl lui Tiopa are trei fii: Pîh, Pah și… Cum îl cheamă pe al treilea?',
      choices: [{ text: 'Tiopa', emoji: '🐻' }, { text: 'Poh', emoji: '🐼' }, { text: 'Puh', emoji: '🧸' }, { text: 'Peh', emoji: '🐨' }],
    },
    {
      question: 'Continuă șirul: 2, 4, 8, 16, …',
      choices: [{ text: '32', emoji: '🔢' }, { text: '24', emoji: '🔢' }, { text: '18', emoji: '🔢' }, { text: '20', emoji: '🔢' }],
    },
    {
      question: 'Fiecare literă e mutată cu una înainte: VST. Ce cuvânt este?',
      choices: [{ text: 'URS', emoji: '🐻' }, { text: 'ARS', emoji: '🔥' }, { text: 'VIS', emoji: '💭' }, { text: 'ROS', emoji: '🦷' }],
    },
    {
      question: 'Câte luni din an au 28 de zile?',
      choices: [{ text: 'Toate 12', emoji: '📅' }, { text: 'Una', emoji: '1️⃣' }, { text: 'Două', emoji: '2️⃣' }, { text: 'Niciuna', emoji: '0️⃣' }],
    },
    {
      question: 'Ce îți aparține ție, dar ceilalți îl folosesc mai des decât tine?',
      choices: [{ text: 'Numele', emoji: '🏷️' }, { text: 'Periuța', emoji: '🪥' }, { text: 'Umbra', emoji: '👤' }, { text: 'Căciula', emoji: '🧢' }],
    },
    {
      question: 'Cu cât iei mai mult din ea, cu atât se face mai mare. Ce este?',
      choices: [{ text: 'Groapa', emoji: '🕳️' }, { text: 'Coșul', emoji: '🧺' }, { text: 'Râul', emoji: '🌊' }, { text: 'Pușculița', emoji: '🐷' }],
    },
    {
      question: 'Ce număr crește cu 3 dacă îl întorci cu susul în jos?',
      choices: [{ text: '6', emoji: '🙃' }, { text: '8', emoji: '🔢' }, { text: '1', emoji: '🔢' }, { text: '0', emoji: '🔢' }],
    },
    {
      question: 'Ce merge fără să se miște din loc?',
      choices: [{ text: 'Ceasul', emoji: '⏰' }, { text: 'Ploaia', emoji: '🌧️' }, { text: 'Trenul', emoji: '🚂' }, { text: 'Melcul', emoji: '🐌' }],
    },
    {
      question: 'În Morse „•••” e S, iar „———” e O. Ce înseamnă „••• ——— •••”?',
      choices: [{ text: 'SOS, ajutor!', emoji: '🆘' }, { text: 'Salut', emoji: '👋' }, { text: 'Noapte bună', emoji: '🌙' }, { text: 'Totul e bine', emoji: '👍' }],
    },
    {
      question: 'N-are mâini, n-are picioare, dar deschide poarta. Cine e?',
      choices: [{ text: 'Vântul', emoji: '🌬️' }, { text: 'Pisica', emoji: '🐱' }, { text: 'Cheia', emoji: '🔑' }, { text: 'Zăpada', emoji: '❄️' }],
    },
  ],
};
