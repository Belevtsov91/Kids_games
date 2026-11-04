import type { Texts } from './ru';

export const en: Texts = {
  speech: 'en',
  title: 'Pack Your Bag',
  lead: (name?: string) => (name ? `${name}, where are we going today?` : 'Where are we going today?'),
  back: '‹ Back',
  go: "Let's go! ▶",
  more: '🗺️ Another trip',
  packed: (n: number, of: number) => `In the bag: ${n} of ${of}`,
  trips: {
    rain: "It's raining", beach: 'Off to the beach', snow: 'It snowed', kindergarten: 'Off to kindergarten',
    hike: 'Going on a hike', sleepover: "Sleepover at Grandma's", windy: 'A windy day', rink: 'Off to the ice rink',
  },
  items: {
    umbrella: 'umbrella', coat: 'coat', boots: 'boots', swimsuit: 'swimsuit', sunglasses: 'sunglasses', sunhat: 'sun hat',
    sunscreen: 'sunscreen', bucket: 'bucket', mittens: 'mittens', scarf: 'scarf', sled: 'sled', snack: 'apple',
    water: 'water', pencils: 'pencils', teddy: 'teddy', book: 'book', toothbrush: 'toothbrush', torch: 'torch',
    map: 'map', compass: 'compass', ball: 'ball', flipflops: 'flip-flops', skates: 'skates', kite: 'kite',
  },
  sayTrip: (trip: string) => `${trip}. What shall we take? Tap the things.`,
  sayPacked: (item: string) => `The ${item} goes in the bag!`,
  sayWrong: (item: string) => `A ${item}? We won't need it now. Think again.`,
  sayReady: 'All packed! Off we go!',
  doneTitle: 'Ready!',
  sayEnding: "It's almost rest time. Let's finish calmly.",
};
