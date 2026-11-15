// Texte: română.
import type { Texts } from './ru';

export const ro: Texts = {
  title: 'Poșta secretă',
  intro: (name) =>
    name ? `${name}, pe insulă au sosit scrisori secrete! Îl ajuți pe Tiopa să le citească?` : 'Pe insulă au sosit scrisori secrete! Îl ajuți pe Tiopa să le citească?',
  exit: 'Ieși din joc',
  toMenu: 'La poștă',
  bag: (n) => `Sacul ${n}`,
  best: (stars) => (stars ? '⭐'.repeat(stars) : 'încă nedeschis'),
  modes: {
    wheel: { name: 'Roata lui Cezar', about: 'Fiecare literă e mutată în alfabet. Rotește roata și scrisoarea va vorbi.' },
    lighthouse: { name: 'Semnalele farului', about: 'Farul clipește în Morse: o licărire scurtă e punct, una lungă e linie.' },
    riddle: { name: 'Scrisori-ghicitori', about: 'În plic e o întrebare cu capcană. Gândește ca un detectiv și alege răspunsul.' },
  },
  letterOf: (n, of) => `Scrisoarea ${n} din ${of}`,
  wheel: {
    known: (key) => `Pe plic scrie cheia ${key}. Rotește roata cu ${key} și citește scrisoarea.`,
    unknown: 'Cheia s-a pierdut! Rotește roata până când cifrul devine un cuvânt adevărat.',
    cipher: 'Cifru',
    plain: 'Se citește',
    shift: (key) => `Deplasare: ${key}`,
    left: 'Rotește roata înapoi',
    right: 'Rotește roata înainte',
    check: 'Citește scrisoarea',
    wrongKnown: (key) => `Încă nu. Cheia de pe plic e ${key}, verifică roata.`,
    wrongUnknown: 'Deocamdată iese ceva fără sens. Încearcă altă deplasare.',
    hint: 'Inelul exterior arată literele cifrului, cel interior pe cele adevărate.',
  },
  lighthouse: {
    prompt: 'Farul clipește o literă. Care este?',
    legend: '• licărire scurtă, — lungă',
    replay: 'Repetă semnalul',
    book: 'Cartea codurilor',
    letter: (n, of) => `Litera ${n} din ${of}`,
    wrong: 'E altă literă. Compară semnalul cu cartea codurilor.',
  },
  riddle: {
    prompt: 'Scrisoare-ghicitoare',
    wrong: 'Hm, nu chiar. Recitește întrebarea cu atenție.',
  },
  solved: 'Scrisoare descifrată!',
  doneTitle: (stars) => (stars === 3 ? 'Poștă perfectă!' : stars === 2 ? 'Bravo!' : 'Sac sortat!'),
  doneText: (mistakes) => (mistakes ? `Greșeli: ${mistakes}. Tiopa e mulțumit!` : 'Nicio greșeală. Tiopa e încântat!'),
  again: '↻ Încă un sac',
  next: 'Mai departe →',
  bear: 'Tiopa',
  praise: ['Corect!', 'Ține-o tot așa!', 'Cifru spart!', 'Excelent!', 'Super!'],
};
