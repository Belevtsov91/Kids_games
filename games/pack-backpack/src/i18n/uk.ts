import type { Texts } from './ru';

export const uk: Texts = {
  speech: 'uk',
  title: 'Збери рюкзак',
  lead: (name?: string) => (name ? `${name}, куди підемо сьогодні?` : 'Куди підемо сьогодні?'),
  back: '‹ Назад',
  go: 'Ходімо! ▶',
  more: '🗺️ Інша прогулянка',
  packed: (n: number, of: number) => `У рюкзаку ${n} з ${of}`,
  trips: {
    rain: 'Надворі дощ', beach: 'Йдемо на пляж', snow: 'Випав сніг', kindergarten: 'Йдемо в садочок',
    hike: 'Йдемо в похід', sleepover: 'Ночуємо в бабусі', windy: 'Вітряний день', rink: 'Йдемо на ковзанку',
  },
  items: {
    umbrella: 'парасолька', coat: 'куртка', boots: 'чобітки', swimsuit: 'купальник', sunglasses: 'сонцезахисні окуляри', sunhat: 'панамка',
    sunscreen: 'крем від сонця', bucket: 'відерце', mittens: 'рукавички', scarf: 'шарф', sled: 'санчата', snack: 'яблуко',
    water: 'вода', pencils: 'олівці', teddy: 'ведмедик', book: 'книжка', toothbrush: 'зубна щітка', torch: 'ліхтарик',
    map: 'мапа', compass: 'компас', ball: 'м’яч', flipflops: 'шльопанці', skates: 'ковзани', kite: 'повітряний змій',
  },
  sayTrip: (trip: string) => `${trip}. Що візьмемо з собою? Натискай на речі.`,
  sayPacked: (item: string) => `${item} — у рюкзак!`,
  sayWrong: (item: string) => `${item}? Зараз не знадобиться. Подумай ще.`,
  sayReady: 'Усе зібрано! Можна йти!',
  doneTitle: 'Готово!',
  sayEnding: 'Скоро відпочинок. Спокійно завершимо.',
};
