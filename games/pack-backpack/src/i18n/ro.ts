import type { Texts } from './ru';

export const ro: Texts = {
  speech: 'ro',
  title: 'Fă-ți rucsacul',
  lead: (name?: string) => (name ? `${name}, unde mergem azi?` : 'Unde mergem azi?'),
  back: '‹ Înapoi',
  go: 'Hai să mergem! ▶',
  more: '🗺️ Altă plimbare',
  packed: (n: number, of: number) => `În rucsac: ${n} din ${of}`,
  trips: {
    rain: 'Afară plouă', beach: 'Mergem la plajă', snow: 'A nins', kindergarten: 'Mergem la grădiniță',
    hike: 'Mergem în drumeție', sleepover: 'Dormim la bunica', windy: 'E o zi cu vânt', rink: 'Mergem la patinoar',
  },
  items: {
    umbrella: 'umbrela', coat: 'geaca', boots: 'cizmele', swimsuit: 'costumul de baie', sunglasses: 'ochelarii de soare', sunhat: 'pălăria',
    sunscreen: 'crema de soare', bucket: 'găletușa', mittens: 'mănușile', scarf: 'fularul', sled: 'sania', snack: 'mărul',
    water: 'apa', pencils: 'creioanele', teddy: 'ursulețul', book: 'cartea', toothbrush: 'periuța de dinți', torch: 'lanterna',
    map: 'harta', compass: 'busola', ball: 'mingea', flipflops: 'papucii', skates: 'patinele', kite: 'zmeul',
  },
  sayTrip: (trip: string) => `${trip}. Ce luăm cu noi? Apasă pe lucruri.`,
  sayPacked: (item: string) => `${item} — în rucsac!`,
  sayWrong: (item: string) => `${item}? Acum nu ne trebuie. Mai gândește-te.`,
  sayReady: 'Totul e gata! Putem pleca!',
  doneTitle: 'Gata!',
  sayEnding: 'Curând facem o pauză. Hai să terminăm liniștit.',
};
