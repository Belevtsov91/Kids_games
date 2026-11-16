// Страны игры: где столица (широта, долгота) и к какому маршруту страна относится.
// Названия и столицы на всех языках — в src/dict, флаги — в flags.ts.

export const REGIONS = ['home', 'europe', 'world'] as const;
export type Region = (typeof REGIONS)[number];

export const COUNTRY_IDS = [
  'md', 'ua', 'ro',
  'pl', 'hu', 'bg', 'de', 'fr', 'it', 'es', 'gb', 'gr', 'tr', 'at', 'cz', 'nl', 'se', 'fi', 'no', 'pt', 'ie', 'be', 'ch', 'dk',
  'us', 'ca', 'mx', 'br', 'ar', 'pe', 'cl', 'cn', 'jp', 'kr', 'in', 'th', 'id', 'eg', 'ma', 'ke', 'ng', 'au', 'nz',
] as const;
export type CountryId = (typeof COUNTRY_IDS)[number];

export interface Country {
  id: CountryId;
  region: Region;
  /** Столица: широта и долгота в градусах. */
  lat: number;
  lon: number;
}

const HOME: Record<string, [number, number]> = { md: [47.0, 28.86], ua: [50.45, 30.52], ro: [44.43, 26.1] };
const EUROPE: Record<string, [number, number]> = {
  pl: [52.23, 21.01], hu: [47.5, 19.04], bg: [42.7, 23.32], de: [52.52, 13.4], fr: [48.86, 2.35], it: [41.9, 12.5],
  es: [40.42, -3.7], gb: [51.51, -0.13], gr: [37.98, 23.73], tr: [39.93, 32.86], at: [48.21, 16.37], cz: [50.08, 14.44],
  nl: [52.37, 4.9], se: [59.33, 18.07], fi: [60.17, 24.94], no: [59.91, 10.75], pt: [38.72, -9.14], ie: [53.35, -6.26],
  be: [50.85, 4.35], ch: [46.95, 7.45], dk: [55.68, 12.57],
};
const WORLD: Record<string, [number, number]> = {
  us: [38.9, -77.04], ca: [45.42, -75.7], mx: [19.43, -99.13], br: [-15.79, -47.88], ar: [-34.6, -58.38], pe: [-12.05, -77.04],
  cl: [-33.45, -70.67], cn: [39.9, 116.4], jp: [35.68, 139.69], kr: [37.57, 126.98], in: [28.61, 77.21], th: [13.76, 100.5],
  id: [-6.2, 106.85], eg: [30.04, 31.24], ma: [34.02, -6.83], ke: [-1.29, 36.82], ng: [9.08, 7.4], au: [-35.28, 149.13],
  nz: [-41.29, 174.78],
};

const build = (region: Region, table: Record<string, [number, number]>): Country[] =>
  Object.entries(table).map(([id, [lat, lon]]) => ({ id: id as CountryId, region, lat, lon }));

export const COUNTRIES: Country[] = [...build('home', HOME), ...build('europe', EUROPE), ...build('world', WORLD)];

const BY_ID = new Map(COUNTRIES.map((c) => [c.id, c]));
export const country = (id: CountryId): Country => BY_ID.get(id)!;
export const inRegion = (region: Region) => COUNTRIES.filter((c) => c.region === region);

/** Угловое расстояние между столицами в градусах (по большому кругу). */
export const distance = (a: Country, b: Country) => {
  const r = Math.PI / 180;
  const cos =
    Math.sin(a.lat * r) * Math.sin(b.lat * r) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.cos((a.lon - b.lon) * r);
  return Math.acos(Math.min(1, Math.max(-1, cos))) / r;
};

/** Страны, у которых флаги легко спутать: из них берём подсказки-ловушки для вопросов про флаги. */
export const LOOKALIKES: Partial<Record<CountryId, CountryId[]>> = {
  md: ['ro', 'be'], ro: ['md', 'be'], be: ['ro', 'de'], de: ['be', 'bg'], fr: ['nl', 'it'], nl: ['fr', 'th'],
  it: ['ie', 'mx'], ie: ['it', 'fr'], mx: ['it', 'ie'], id: ['pl', 'at'], pl: ['id', 'at'], at: ['pe', 'pl'],
  pe: ['ca', 'at'], ca: ['pe', 'ch'], ch: ['dk', 'ca'], dk: ['no', 'ch'], no: ['dk', 'fi'], fi: ['se', 'gr'],
  se: ['fi', 'no'], gb: ['au', 'nz'], au: ['nz', 'gb'], nz: ['au', 'gb'], ua: ['se', 'ro'], hu: ['bg', 'it'],
  bg: ['hu', 'it'], cl: ['cz', 'us'], cz: ['cl', 'pl'],
  us: ['cl', 'gb'], jp: ['kr', 'tr'], kr: ['jp', 'cn'], cn: ['tr', 'ma'], tr: ['ma', 'cn'], ma: ['tr', 'cn'],
};
