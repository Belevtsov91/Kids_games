// Рисует флаг из описания в flags.ts как строку SVG (без DOM — легко проверить в тестах).
import type { CountryId } from '../game/countries';
import { FLAGS, type Extra, type FlagSpec } from '../game/flags';

const n = (v: number) => +v.toFixed(2);

/** Пятиконечная звезда с центром (x, y) и внешним радиусом r. */
export const starPoints = (x: number, y: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 ? r * 0.4 : r;
    return `${n(x + d * Math.cos(a))},${n(y + d * Math.sin(a))}`;
  }).join(' ');

/** Британский флаг в прямоугольнике 0,0 – w,h (своя система координат 60×30). */
const jack = (w: number, h: number) =>
  `<svg x="0" y="0" width="${w}" height="${h}" viewBox="0 0 60 30" preserveAspectRatio="none">` +
  '<rect width="60" height="30" fill="#012169"/>' +
  '<path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>' +
  '<path d="M0,0 L60,30 M60,0 L0,30" stroke="#c8102e" stroke-width="2"/>' +
  '<path d="M30,0 V30 M0,15 H60" stroke="#fff" stroke-width="10"/>' +
  '<path d="M30,0 V30 M0,15 H60" stroke="#c8102e" stroke-width="6"/></svg>';

const extra = (e: Extra): string => {
  switch (e.k) {
    case 'rect':
      return `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" fill="${e.c}"/>`;
    case 'circle':
      return e.ring
        ? `<circle cx="${e.x}" cy="${e.y}" r="${e.r}" fill="none" stroke="${e.c}" stroke-width="${e.ring}"/>`
        : `<circle cx="${e.x}" cy="${e.y}" r="${e.r}" fill="${e.c}"/>`;
    case 'star':
      return e.line
        ? `<polygon points="${starPoints(e.x, e.y, e.r)}" fill="none" stroke="${e.c}" stroke-width="0.8" stroke-linejoin="round"/>`
        : `<polygon points="${starPoints(e.x, e.y, e.r)}" fill="${e.c}"/>`;
    case 'cross':
      return `<rect x="${e.x - e.w / 2}" y="0" width="${e.w}" height="20" fill="${e.c}"/><rect x="0" y="${10 - e.w / 2}" width="30" height="${e.w}" fill="${e.c}"/>`;
    case 'poly':
      return `<polygon points="${e.pts}" fill="${e.c}"/>`;
    case 'path':
      return `<path d="${e.d}" fill="${e.c}"/>`;
    case 'jack':
      return jack(e.w, e.h);
  }
};

const bands = (spec: FlagSpec) => {
  const ratios = spec.ratios ?? spec.stripes.map(() => 1);
  const total = ratios.reduce((a, b) => a + b, 0);
  const size = spec.vertical ? 30 : 20;
  let at = 0;
  return spec.stripes
    .map((c, i) => {
      const len = (ratios[i] / total) * size;
      const from = at;
      at += len;
      // Небольшой нахлёст убирает тонкие щели между полосами при сглаживании.
      const pad = i < spec.stripes.length - 1 ? 0.05 : 0;
      return spec.vertical
        ? `<rect x="${n(from)}" y="0" width="${n(len + pad)}" height="20" fill="${c}"/>`
        : `<rect x="0" y="${n(from)}" width="30" height="${n(len + pad)}" fill="${c}"/>`;
    })
    .join('');
};

export const flagSvg = (id: CountryId) => {
  const spec = FLAGS[id];
  return `<svg class="at-flag-svg" viewBox="0 0 30 20" aria-hidden="true">${bands(spec)}${(spec.extras ?? []).map(extra).join('')}</svg>`;
};
