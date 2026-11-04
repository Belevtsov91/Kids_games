// Кубики сказки: герой, место, что случилось и что помогло. Тексты для них лежат в i18n.

export const HEROES = ['bunny', 'hedgehog', 'dragon', 'kitten', 'robot', 'bear'] as const;
export const PLACES = ['forest', 'sea', 'space', 'castle', 'mountains', 'city'] as const;
export const TWISTS = ['rain', 'lost', 'dark', 'friend', 'river', 'wind'] as const;
export const ITEMS = ['lamp', 'umbrella', 'map', 'pipe', 'pie', 'key'] as const;

export type Hero = (typeof HEROES)[number];
export type Place = (typeof PLACES)[number];
export type Twist = (typeof TWISTS)[number];
export type Item = (typeof ITEMS)[number];

export interface Tale {
  hero: Hero;
  place: Place;
  twist: Twist;
  item: Item;
  /** Когда сочинили (мс), чтобы показать новые сказки первыми. */
  at: number;
}

export const EMOJI: Record<Hero | Place | Twist | Item, string> = {
  bunny: '🐰', hedgehog: '🦔', dragon: '🐲', kitten: '🐱', robot: '🤖', bear: '🐻',
  forest: '🌲', sea: '🌊', space: '🪐', castle: '🏰', mountains: '⛰️', city: '🏙️',
  rain: '🌧️', lost: '🧭', dark: '🌙', friend: '😢', river: '🏞️', wind: '🌪️',
  lamp: '🔦', umbrella: '☂️', map: '🗺️', pipe: '🎶', pie: '🥧', key: '🗝️',
};

/** Шаги сборки по порядку: начало (кто и куда), середина (что случилось), конец (что помогло). */
export const STEPS = ['hero', 'place', 'twist', 'item'] as const;
export type Step = (typeof STEPS)[number];

export const OPTIONS: Record<Step, readonly string[]> = { hero: HEROES, place: PLACES, twist: TWISTS, item: ITEMS };

const pick = <T>(list: readonly T[], rnd: () => number): T => list[Math.min(list.length - 1, Math.floor(rnd() * list.length))]!;

/** «Удиви меня»: случайная сказка, если ребёнок не может выбрать. */
export const randomTale = (rnd: () => number, at = Date.now()): Tale => ({
  hero: pick(HEROES, rnd),
  place: pick(PLACES, rnd),
  twist: pick(TWISTS, rnd),
  item: pick(ITEMS, rnd),
  at,
});

/** Три картинки комикса: что нарисовано на каждой. */
export interface Panel {
  scene: string;
  actors: string[];
}

export const panelsOf = (t: Tale): Panel[] => [
  { scene: t.place, actors: [EMOJI[t.hero]] },
  { scene: t.place, actors: [EMOJI[t.hero], EMOJI[t.twist]] },
  { scene: t.place, actors: [EMOJI[t.hero], EMOJI[t.item], '✨'] },
];

const isIn = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v);

/** Проверка сохранённой сказки: в хранилище могло оказаться что угодно. */
export function readTale(raw: unknown): Tale | null {
  const r = raw as Partial<Tale> | null;
  if (!r || !isIn(HEROES, r.hero) || !isIn(PLACES, r.place) || !isIn(TWISTS, r.twist) || !isIn(ITEMS, r.item)) return null;
  const at = Number(r.at);
  return { hero: r.hero, place: r.place, twist: r.twist, item: r.item, at: Number.isFinite(at) && at > 0 ? at : 0 };
}
