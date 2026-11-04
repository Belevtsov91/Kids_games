// Тексты: русский (образец формы для остальных языков).
export const ru = {
  speech: 'ru',
  title: 'Собери рюкзак',
  lead: (name?: string) => (name ? `${name}, куда пойдём сегодня?` : 'Куда пойдём сегодня?'),
  back: '‹ Назад',
  go: 'Идём! ▶',
  more: '🗺️ Другая прогулка',
  packed: (n: number, of: number) => `В рюкзаке ${n} из ${of}`,
  trips: {
    rain: 'На улице дождь', beach: 'Идём на пляж', snow: 'Выпал снег', kindergarten: 'Идём в садик',
    hike: 'Идём в поход', sleepover: 'Ночуем у бабушки', windy: 'Ветреный день', rink: 'Идём на каток',
  } as Record<string, string>,
  items: {
    umbrella: 'зонтик', coat: 'куртка', boots: 'сапожки', swimsuit: 'купальник', sunglasses: 'очки от солнца', sunhat: 'панамка',
    sunscreen: 'крем от солнца', bucket: 'ведёрко', mittens: 'варежки', scarf: 'шарф', sled: 'санки', snack: 'яблоко',
    water: 'вода', pencils: 'карандаши', teddy: 'мишка', book: 'книжка', toothbrush: 'зубная щётка', torch: 'фонарик',
    map: 'карта', compass: 'компас', ball: 'мяч', flipflops: 'шлёпанцы', skates: 'коньки', kite: 'воздушный змей',
  } as Record<string, string>,
  sayTrip: (trip: string) => `${trip}. Что возьмём с собой? Нажимай на вещи.`,
  sayPacked: (item: string) => `${item} — в рюкзак!`,
  sayWrong: (item: string) => `${item}? Сейчас не пригодится. Подумай ещё.`,
  sayReady: 'Всё собрано! Можно идти!',
  doneTitle: 'Готово!',
  sayEnding: 'Скоро отдых. Давай спокойно закончим.',
};

export type Texts = typeof ru;
