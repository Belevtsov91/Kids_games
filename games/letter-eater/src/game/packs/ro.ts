// Буквы и слова: română.
import type { LanguagePack } from './types';

export const ro: LanguagePack = {
  alphabet: 'AĂÂBCDEFGHIÎJKLMNOPRSȘTȚUVXZ',
  similar: {
    A: 'ĂÂ', Ă: 'AÂ', Â: 'AĂÎ', B: 'DPR', C: 'GO', D: 'BP', E: 'FB', F: 'EP', G: 'CO', H: 'NK',
    I: 'ÎJL', Î: 'IÂ', J: 'IL', K: 'HX', L: 'IT', M: 'NV', N: 'MH', O: 'CG', P: 'BRD', R: 'PB',
    S: 'ȘZ', Ș: 'SȚ', T: 'ȚL', Ț: 'TȘ', U: 'VO', V: 'UX', X: 'KZ', Z: 'SX',
  },
  letterNames: {
    A: 'a', Ă: 'ă', Â: 'â din a', B: 'be', C: 'ce', D: 'de', E: 'e', F: 'ef', G: 'ge', H: 'haș',
    I: 'i', Î: 'î din i', J: 'je', K: 'ka', L: 'el', M: 'em', N: 'en', O: 'o', P: 'pe', R: 'er',
    S: 'es', Ș: 'șe', T: 'te', Ț: 'țe', U: 'u', V: 've', X: 'ics', Z: 'zet',
  },
  levels: [
    {
      title: 'Primele cuvinte',
      words: [
        { word: 'CAL', emoji: '🐴' }, { word: 'NAS', emoji: '👃' }, { word: 'URS', emoji: '🐻' }, { word: 'LUP', emoji: '🐺' },
        { word: 'MĂR', emoji: '🍎' }, { word: 'PAT', emoji: '🛏️' }, { word: 'NOR', emoji: '☁️' }, { word: 'SUC', emoji: '🧃' },
        { word: 'DAR', emoji: '🎁' }, { word: 'BEC', emoji: '💡' }, { word: 'LEU', emoji: '🦁' }, { word: 'SAC', emoji: '🎒' },
      ],
    },
    {
      title: 'Patru litere',
      words: [
        { word: 'LUNA', emoji: '🌙', art: 'ЛУНА' }, { word: 'CASĂ', emoji: '🏠' }, { word: 'TORT', emoji: '🎂' }, { word: 'RAȚĂ', emoji: '🦆' },
        { word: 'VACĂ', emoji: '🐄' }, { word: 'PARĂ', emoji: '🍐' }, { word: 'ROZĂ', emoji: '🌹' }, { word: 'LAMĂ', emoji: '🦙' },
        { word: 'SUPĂ', emoji: '🍲' }, { word: 'CEAS', emoji: '⌚' }, { word: 'STEA', emoji: '⭐' }, { word: 'MELC', emoji: '🐌' },
        { word: 'OAIE', emoji: '🐑' }, { word: 'TREN', emoji: '🚂' },
      ],
    },
    {
      title: 'Cuvinte mai grele',
      words: [
        { word: 'VULPE', emoji: '🦊', art: 'ЛИСА' }, { word: 'ZEBRĂ', emoji: '🦓' }, { word: 'KOALA', emoji: '🐨' }, { word: 'PANDA', emoji: '🐼' },
        { word: 'TIGRU', emoji: '🐯' }, { word: 'CARTE', emoji: '📚' }, { word: 'CAPRĂ', emoji: '🐐' }, { word: 'MINGE', emoji: '⚽' },
        { word: 'PEȘTE', emoji: '🐟', art: 'РЫБА' }, { word: 'SOARE', emoji: '☀️' }, { word: 'PÂINE', emoji: '🍞' },
      ],
    },
    {
      title: 'Cuvinte lungi',
      words: [
        { word: 'GIRAFĂ', emoji: '🦒' }, { word: 'IEPURE', emoji: '🐰', art: 'ЗАЯЦ' }, { word: 'RACHETĂ', emoji: '🚀' }, { word: 'MAȘINĂ', emoji: '🚗' },
        { word: 'PINGUIN', emoji: '🐧', art: 'ПИНГВИН' }, { word: 'MORCOV', emoji: '🥕', art: 'МОРКОВЬ' }, { word: 'AUTOBUZ', emoji: '🚌' }, { word: 'DELFIN', emoji: '🐬', art: 'ДЕЛЬФИН' },
        { word: 'FLUTURE', emoji: '🦋' }, { word: 'CĂMILĂ', emoji: '🐫' }, { word: 'CASTEL', emoji: '🏰' }, { word: 'BUFNIȚĂ', emoji: '🦉', art: 'СОВА' },
        { word: 'PISICĂ', emoji: '🐱', art: 'КОТ' },
      ],
    },
    {
      title: 'Campion',
      words: [
        { word: 'ȚESTOASĂ', emoji: '🐢', art: 'ЧЕРЕПАХА' }, { word: 'STRUGURI', emoji: '🍇' }, { word: 'CROCODIL', emoji: '🐊' }, { word: 'BICICLETĂ', emoji: '🚲' },
        { word: 'ÎNGHEȚATĂ', emoji: '🍦' }, { word: 'DINOZAUR', emoji: '🦕' }, { word: 'CĂPȘUNĂ', emoji: '🍓' }, { word: 'ELEFANT', emoji: '🐘', art: 'СЛОН' },
        { word: 'PAPAGAL', emoji: '🦜' }, { word: 'BROASCĂ', emoji: '🐸' }, { word: 'CANGUR', emoji: '🦘' }, { word: 'CARTOFI', emoji: '🥔' },
      ],
    },
  ],
};
