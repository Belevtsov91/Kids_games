// Сезонное оформление дашборда: что падает с неба и что сказать мишке. Чистые функции по дате.

export type Decor = 'winter' | 'spring' | 'summer' | 'autumn' | 'newyear';

/** Новый год — с 20 декабря по 10 января; остальное по месяцам (северное полушарие). */
export function decorOf(d: Date): Decor {
  const m = d.getMonth();
  const day = d.getDate();
  if ((m === 11 && day >= 20) || (m === 0 && day <= 10)) return 'newyear';
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'autumn';
}

/** Что падает с неба: снежинки, лепестки, листья; летом — светлячки. */
export const PARTICLES: Record<Decor, string[]> = {
  newyear: ['❄', '✦', '❄'],
  winter: ['❄', '❅', '❆'],
  spring: ['🌸', '🌼'],
  summer: ['✨'],
  autumn: ['🍂', '🍁'],
};

export type DayPart = 'morning' | 'day' | 'evening';

export const dayPart = (d: Date): DayPart => {
  const h = d.getHours();
  return h >= 5 && h < 12 ? 'morning' : h >= 18 || h < 5 ? 'evening' : 'day';
};

/** Сегодняшняя дата «YYYY-MM-DD» по часам устройства: для отметок «раз в день». */
export const today = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
