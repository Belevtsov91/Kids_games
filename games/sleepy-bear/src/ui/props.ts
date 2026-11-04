// Предметы сцен: еда, пузыри, щётка, фигуры, игрушки, коробки, лампа, звёзды. Всё — свои SVG.
import type { Color, Shape } from '../game/logic';

export const COLOR_HEX: Record<Color, string> = {
  red: '#ff5a5a',
  yellow: '#ffd23f',
  green: '#5cc96b',
  orange: '#ff9a3c',
  purple: '#a56cf0',
  blue: '#4f8cff',
};

const svg = (view: string, body: string, cls = '') => `<svg viewBox="${view}" class="${cls}" aria-hidden="true">${body}</svg>`;

/** Еда по цвету: яблоко, банан, огурец, морковка, слива, черника. */
export function foodSvg(color: Color) {
  const c = COLOR_HEX[color];
  const leaf = '<path d="M52 14c8-8 18-6 20-2-6 6-14 6-20 2z" fill="#5cc96b"/>';
  switch (color) {
    case 'red':
      return svg('0 0 100 100', `<path d="M50 28c-16-10-38 0-36 26 2 26 20 40 36 34 16 6 34-8 36-34 2-26-20-36-36-26z" fill="${c}"/><path d="M50 28c0-8 2-14 6-18" stroke="#7a4a2a" stroke-width="5" stroke-linecap="round"/>${leaf}<ellipse cx="34" cy="46" rx="6" ry="10" fill="#fff" opacity=".35"/>`);
    case 'yellow':
      return svg('0 0 100 100', `<path d="M18 30c6 34 30 52 66 44-4 10-20 18-38 14C24 82 12 56 18 30z" fill="${c}"/><path d="M18 30l-4-8 8 2z" fill="#7a5a2a"/>`);
    case 'green':
      return svg('0 0 100 100', `<rect x="16" y="38" width="70" height="26" rx="13" fill="${c}" transform="rotate(-20 50 50)"/><g fill="#3ea04e"><circle cx="34" cy="56" r="2.5"/><circle cx="50" cy="48" r="2.5"/><circle cx="64" cy="42" r="2.5"/></g>`);
    case 'orange':
      return svg('0 0 100 100', `<path d="M30 30l52 44c-6 8-18 6-26 0L22 40c-2-6 2-12 8-10z" fill="${c}"/><path d="M28 30c-8-10-6-20 0-22 2 8 0 14 0 22zM30 30c-12-4-18 0-18 4 8 2 12 0 18-4z" fill="#5cc96b"/>`);
    case 'purple':
      return svg('0 0 100 100', `<ellipse cx="50" cy="56" rx="30" ry="34" fill="${c}"/><path d="M50 22c0-6 2-10 6-12" stroke="#7a4a2a" stroke-width="4" stroke-linecap="round"/>${leaf}<path d="M50 26v58" stroke="#8a52d8" stroke-width="3"/>`);
    default:
      return svg('0 0 100 100', `<g fill="${c}"><circle cx="34" cy="58" r="16"/><circle cx="64" cy="58" r="16"/><circle cx="49" cy="34" r="16"/></g><g fill="#2f5fc4"><circle cx="34" cy="58" r="4"/><circle cx="64" cy="58" r="4"/><circle cx="49" cy="34" r="4"/></g>`);
  }
}

export const plateSvg = (color: Color | null) =>
  svg('0 0 200 120', `<ellipse cx="100" cy="64" rx="96" ry="52" fill="${color ? COLOR_HEX[color] : '#fff'}" opacity="${color ? 0.35 : 1}"/><ellipse cx="100" cy="60" rx="96" ry="50" fill="#fff"/><ellipse cx="100" cy="60" rx="66" ry="32" fill="none" stroke="${color ? COLOR_HEX[color] : '#e8e0f0'}" stroke-width="8"/>`);

export const bubbleSvg = () =>
  svg('0 0 100 100', `<defs><radialGradient id="bb" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#e6f7ff" stop-opacity=".7"/><stop offset="1" stop-color="#b8e1ff" stop-opacity=".5"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(#bb)" stroke="#9ccfee" stroke-width="2"/>`);

export const brushSvg = () =>
  svg('0 0 200 60', `<rect x="10" y="22" width="130" height="16" rx="8" fill="#4f8cff"/><rect x="136" y="16" width="54" height="28" rx="8" fill="#fff"/><g fill="#9fd6ff">${[0, 1, 2, 3, 4].map((i) => `<rect x="${140 + i * 10}" y="6" width="6" height="14" rx="3"/>`).join('')}</g>`);

const SHAPE_PATH: Record<Shape, string> = {
  circle: '<circle cx="50" cy="50" r="40"/>',
  star: '<path d="M50 8l12 26 28 3-21 19 6 28-25-14-25 14 6-28L10 37l28-3z"/>',
  triangle: '<path d="M50 10l42 76H8z"/>',
  square: '<rect x="12" y="12" width="76" height="76" rx="10"/>',
  heart: '<path d="M50 88S10 62 10 34a20 20 0 0 1 40-6 20 20 0 0 1 40 6c0 28-40 54-40 54z"/>',
};
export const SHAPE_COLOR: Record<Shape, string> = { circle: '#ff7b7b', star: '#ffd23f', triangle: '#7bd389', square: '#c49bff', heart: '#ff8fc0' };

export const shapeSvg = (shape: Shape, slot = false) =>
  svg('0 0 100 100', `<g ${slot ? 'fill="rgba(255,255,255,.25)" stroke="#fff" stroke-width="5" stroke-dasharray="10 8"' : `fill="${SHAPE_COLOR[shape]}"`}>${SHAPE_PATH[shape]}</g>`);

export function toySvg(toy: string) {
  switch (toy) {
    case 'ball':
      return svg('0 0 100 100', '<circle cx="50" cy="50" r="42" fill="#ff5a5a"/><path d="M8 50h84" stroke="#fff" stroke-width="10"/><circle cx="50" cy="50" r="12" fill="#fff"/>');
    case 'duck':
      return svg('0 0 100 100', '<ellipse cx="46" cy="66" rx="38" ry="24" fill="#ffd23f"/><circle cx="62" cy="36" r="20" fill="#ffd23f"/><path d="M80 36l16 4-16 6z" fill="#ff9a3c"/><circle cx="66" cy="32" r="3.5" fill="#3b2a4a"/>');
    case 'cube':
      return svg('0 0 100 100', '<rect x="12" y="12" width="76" height="76" rx="10" fill="#4f8cff"/><text x="50" y="66" text-anchor="middle" font-size="44" font-weight="900" font-family="system-ui" fill="#fff">A</text>');
    default:
      return svg('0 0 100 100', '<rect x="10" y="40" width="80" height="30" rx="12" fill="#5cc96b"/><path d="M28 40l10-16h26l12 16z" fill="#5cc96b"/><rect x="42" y="28" width="18" height="12" fill="#bfe8f2"/><circle cx="30" cy="74" r="11" fill="#3b2a4a"/><circle cx="72" cy="74" r="11" fill="#3b2a4a"/>');
  }
}

export const boxSvg = () =>
  svg('0 0 120 100', '<path d="M8 30h104l-10 66H18z" fill="#e2a86b"/><path d="M8 30l14-22h76l14 22z" fill="#f0c48a"/><rect x="46" y="48" width="28" height="10" rx="5" fill="#b9805a"/>');

export const lampSvg = (on: boolean) =>
  svg('0 0 100 140', `${on ? '<circle cx="50" cy="44" r="46" fill="#ffe9a8" opacity=".45"/>' : ''}<path d="M22 60h56L66 20H34z" fill="${on ? '#ffd27a' : '#8a77c2'}"/><rect x="46" y="60" width="8" height="54" fill="#5c4585"/><rect x="24" y="112" width="52" height="14" rx="7" fill="#5c4585"/>`);

export const starSvg = (lit: boolean) =>
  svg('0 0 100 100', `<path d="M50 8l12 26 28 3-21 19 6 28-25-14-25 14 6-28L10 37l28-3z" ${lit ? 'fill="#ffe27a"' : 'fill="none" stroke="#a99ad6" stroke-width="5" stroke-dasharray="8 7"'}/>`, lit ? 'star is-lit' : 'star');
