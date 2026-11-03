import type { Texts } from './ru';

export const ro: Texts = {
  speech: 'ro',
  title: 'Atelierul formelor',
  lead: (name?: string) => (name ? `${name}, construiește o imagine din forme!` : 'Construiește o imagine din forme!'),
  pictures: 'Imagini',
  free: '🎨 Imaginea mea',
  back: '‹ Înapoi',
  next: 'Mai departe ▶',
  menu: '🏠 Imagini',
  clear: '🗑 Golește',
  freeTip: 'Apasă pe o formă ca să apară. Mut-o cu degetul, apasă din nou ca să schimbi culoarea. Trage-o afară ca s-o scoți.',
  shapes: { circle: 'cerc', oval: 'oval', square: 'pătrat', rect: 'dreptunghi', triangle: 'triunghi', semicircle: 'semicerc', star: 'stea' },
  names: {
    house: 'Căsuța', tree: 'Bradul', snowman: 'Omul de zăpadă', fish: 'Peștișorul', rocket: 'Racheta',
    car: 'Mașinuța', boat: 'Bărcuța', cat: 'Pisica', robot: 'Robotul', castle: 'Castelul',
  },
  sayStart: 'Trage formele la locurile lor. Poți apăsa pe formă, apoi pe loc.',
  sayNeed: (need: string, have: string) => `Acesta e un ${have}. Aici trebuie un ${need}.`,
  sayPlaced: (shape: string) => shape,
  sayDone: (name: string) => `Ura! ${name} e gata!`,
  bravo: 'Gata!',
  sayEnding: 'Curând facem o pauză. Hai să terminăm liniștit.',
};
