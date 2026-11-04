// Texte: română.
import type { Words } from '../game/tell';
import type { Texts } from './ru';

const words: Words = {
  heroes: {
    bunny: { name: 'Iepurașul', a: 'un iepuraș', the: 'iepurașul' },
    hedgehog: { name: 'Ariciul', a: 'un arici', the: 'ariciul' },
    dragon: { name: 'Dragonul', a: 'un dragon mic', the: 'dragonul' },
    kitten: { name: 'Pisoiul', a: 'un pisoi', the: 'pisoiul' },
    robot: { name: 'Robotul', a: 'un robot', the: 'robotul' },
    bear: { name: 'Ursulețul', a: 'un ursuleț', the: 'ursulețul' },
  },
  places: {
    forest: { name: 'Pădurea', to: 'spre pădurea fermecată' },
    sea: { name: 'Marea', to: 'spre marea albastră' },
    space: { name: 'Cosmosul', to: 'în cosmosul îndepărtat' },
    castle: { name: 'Castelul', to: 'spre un castel vechi' },
    mountains: { name: 'Munții', to: 'spre munții înalți' },
    city: { name: 'Orașul', to: 'spre orașul mare' },
  },
  twists: {
    rain: { name: 'Ploaia', line: 'Deodată a început o ploaie mare și s-a făcut ud și frig.' },
    lost: { name: 'Rătăcit', line: 'Dar drumul s-a încurcat și nu se mai știa încotro.' },
    dark: { name: 'Întunericul', line: 'Apoi s-a lăsat noaptea și s-a făcut întuneric.' },
    friend: { name: 'Un prieten trist', line: 'Pe drum a întâlnit un prieten trist, care se simțea singur.' },
    river: { name: 'Râul', line: 'În față era un râu lat, fără pod.' },
    wind: { name: 'Vântul', line: 'Deodată a suflat un vânt atât de tare, încât i-a luat căciula!' },
  },
  items: {
    lamp: { name: 'Lanterna', use: 'a aprins lanterna fermecată' },
    umbrella: { name: 'Umbrela', use: 'a deschis umbrela cea mare' },
    map: { name: 'Harta', use: 'a scos harta veche' },
    pipe: { name: 'Fluierul', use: 'a cântat din fluierul fermecat' },
    pie: { name: 'Plăcinta', use: 'a împărțit o plăcintă gustoasă' },
    key: { name: 'Cheița', use: 'a găsit cheița de aur' },
  },
  begin: (a, to) => `A fost odată ${a}. Într-o zi a pornit ${to}.`,
  end: (the, use) => `Atunci ${the} ${use} și totul s-a terminat cu bine!`,
};

export const ro: Texts = {
  speech: 'ro',
  title: 'Atelierul de povești',
  lead: (name?: string) => (name ? `${name}, hai să inventăm o poveste!` : 'Hai să inventăm o poveste!'),
  newTale: '✨ Poveste nouă',
  shelf: (n: number) => `📚 Poveștile mele: ${n}`,
  surprise: '🎲 Surprinde-mă',
  step: (n: number) => `Pasul ${n} din 4`,
  ask: { hero: 'Cine va fi eroul?', place: 'Unde va pleca?', twist: 'Ce s-a întâmplat pe drum?', item: 'Ce l-a ajutat?' },
  tellAsk: ['Povestește cum a început totul.', 'Ce s-a întâmplat apoi?', 'Cum s-a terminat?'],
  hint: '🔊 Indiciu',
  told: 'Am povestit! ▶',
  done: 'Povestea e gata!',
  readAll: '📖 Citește povestea',
  home: '🏠 La atelier',
  back: '◀ Înapoi',
  and: 'și',
  empty: 'Aici vor locui poveștile tale.',
  coach: 'Pentru adult: întrebați „Ce-ar fi fost dacă…?” și lăsați copilul să continue singur.',
  sayDone: 'Ce poveste minunată! O pun pe raft.',
  sayEnding: 'Curând facem pauză. Hai să terminăm povestea.',
  words,
};
