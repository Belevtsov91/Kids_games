import type { Texts } from './ru';

export const ro: Texts = {
  speech: 'ro',
  title: 'Trenulețul memoriei',
  lead: (name?: string) => (name ? `${name}, ține minte cine călătorește cu trenulețul!` : 'Ține minte cine călătorește cu trenulețul!'),
  play: '▶ Pornim',
  level: (n: number) => `Vagoane: ${n}`,
  best: (n: number) => `Record: ${n} vagoane`,
  watch: 'Uită-te atent!',
  tunnel: 'Trenulețul e în tunel…',
  askWhich: (n: number) => `Cine era în vagonul numărul ${n}?`,
  askMissing: 'Cine a coborât din tren?',
  askOrder: 'Apasă pe animăluțe în ordine: cine a fost primul, cine al doilea…',
  next: 'Mai departe ▶',
  home: '🏠 Gara',
  sayRight: 'Corect! Bravo!',
  sayWrong: 'Nu chiar. Uite cine era acolo!',
  sayOrderWrong: 'Nu, acesta nu era aici. Mai gândește-te.',
  sayLevelUp: 'Grozav! Mai legăm un vagon!',
  sayEnding: 'Curând facem o pauză. Hai să terminăm liniștit.',
};
