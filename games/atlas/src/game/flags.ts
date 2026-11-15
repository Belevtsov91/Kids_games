// Флаги в упрощённом виде: полосы и несколько фигур поверх, в рамке 30×20.
// Детали гербов не рисуем, но каждый флаг узнаётся, а похожие (Молдова и Румыния) различимы.
import type { CountryId } from './countries';

export type Extra =
  | { k: 'rect'; x: number; y: number; w: number; h: number; c: string }
  | { k: 'circle'; x: number; y: number; r: number; c: string; ring?: number }
  | { k: 'star'; x: number; y: number; r: number; c: string; line?: boolean }
  | { k: 'cross'; x: number; w: number; c: string }
  | { k: 'poly'; pts: string; c: string }
  | { k: 'path'; d: string; c: string }
  | { k: 'jack'; w: number; h: number };

export interface FlagSpec {
  stripes: string[];
  vertical?: boolean;
  ratios?: number[];
  extras?: Extra[];
}

const W = '#ffffff';
const rect = (x: number, y: number, w: number, h: number, c: string): Extra => ({ k: 'rect', x, y, w, h, c });
const circle = (x: number, y: number, r: number, c: string, ring?: number): Extra => ({ k: 'circle', x, y, r, c, ring });
const star = (x: number, y: number, r: number, c: string, line?: boolean): Extra => ({ k: 'star', x, y, r, c, line });
const nordic = (c: string, w: number): Extra => ({ k: 'cross', x: 11, w, c });
const stripes = (n: number, a: string, b: string) => Array.from({ length: n }, (_, i) => (i % 2 ? b : a));

/** Кленовый лист Канады: симметричный многоугольник вокруг (15, 10). */
const MAPLE = (() => {
  const half = [[0, -5.5], [1, -3.4], [2, -3.9], [1.7, -1.2], [3.6, -2.4], [3.2, -0.9], [4.6, -0.4], [3.4, 0.9], [3.9, 2.1], [0.9, 1.8], [0.4, 3.4], [0.4, 5]];
  const pts = [...half, ...half.slice().reverse().map(([x, y]) => [-x, y])];
  return pts.map(([x, y]) => `${15 + x},${10 + y}`).join(' ');
})();

const SOUTHERN_CROSS = (c: string, r: number) => [star(22.5, 4.2, r, c), star(19.4, 9, r, c), star(25.8, 8, r, c), star(22.5, 16.2, r, c)];

export const FLAGS: Record<CountryId, FlagSpec> = {
  md: { stripes: ['#0046ae', '#ffd200', '#cc092f'], vertical: true, extras: [{ k: 'path', d: 'M13,7 h4 v3 q0,2.6 -2,3.6 q-2,-1 -2,-3.6z', c: '#8a5a2b' }, circle(15, 9.2, 0.9, '#ffd200')] },
  ua: { stripes: ['#0057b7', '#ffd700'] },
  ro: { stripes: ['#002b7f', '#fcd116', '#ce1126'], vertical: true },
  pl: { stripes: [W, '#dc143c'] },
  hu: { stripes: ['#ce2939', W, '#477050'] },
  bg: { stripes: [W, '#00966e', '#d62612'] },
  de: { stripes: ['#000000', '#dd0000', '#ffce00'] },
  fr: { stripes: ['#0055a4', W, '#ef4135'], vertical: true },
  it: { stripes: ['#009246', W, '#ce2b37'], vertical: true },
  es: { stripes: ['#aa151b', '#f1bf00', '#aa151b'], ratios: [1, 2, 1], extras: [rect(7, 8, 3, 4, '#aa151b')] },
  gb: { stripes: ['#012169'], extras: [{ k: 'jack', w: 30, h: 20 }] },
  gr: { stripes: stripes(9, '#0d5eaf', W), extras: [rect(0, 0, 11.1, 11.1, '#0d5eaf'), rect(0, 4.44, 11.1, 2.22, W), rect(4.44, 0, 2.22, 11.1, W)] },
  tr: { stripes: ['#e30a17'], extras: [circle(10.5, 10, 5, W), circle(11.8, 10, 4, '#e30a17'), star(17, 10, 2.2, W)] },
  at: { stripes: ['#ed2939', W, '#ed2939'] },
  cz: { stripes: [W, '#d7141a'], extras: [{ k: 'poly', pts: '0,0 15,10 0,20', c: '#11457e' }] },
  nl: { stripes: ['#ae1c28', W, '#21468b'] },
  se: { stripes: ['#006aa7'], extras: [nordic('#fecc00', 3)] },
  fi: { stripes: [W], extras: [nordic('#002f6c', 4)] },
  no: { stripes: ['#ba0c2f'], extras: [nordic(W, 4.4), nordic('#00205b', 2.2)] },
  pt: { stripes: ['#006600', '#ff0000'], vertical: true, ratios: [2, 3], extras: [circle(12, 10, 3.4, '#ffcc00', 0.9), rect(11, 8.6, 2, 2.8, W)] },
  ie: { stripes: ['#169b62', W, '#ff883e'], vertical: true },
  be: { stripes: ['#000000', '#fdda24', '#ef3340'], vertical: true },
  ch: { stripes: ['#da291c'], extras: [rect(13, 4, 4, 12, W), rect(9, 8, 12, 4, W)] },
  dk: { stripes: ['#c8102e'], extras: [nordic(W, 2.6)] },
  us: {
    stripes: stripes(13, '#b22234', W),
    extras: [rect(0, 0, 12, 10.77, '#3c3b6e'), ...[0, 1, 2, 3, 4].flatMap((i) => [0, 1, 2, 3].map((j) => circle(1.6 + i * 2.2, 1.6 + j * 2.5, 0.5, W)))],
  },
  ca: { stripes: ['#d52b1e', W, '#d52b1e'], vertical: true, ratios: [1, 2, 1], extras: [{ k: 'poly', pts: MAPLE, c: '#d52b1e' }] },
  mx: { stripes: ['#006847', W, '#ce1126'], vertical: true, extras: [circle(15, 10, 2.2, '#9b6a2f', 0.7)] },
  br: { stripes: ['#009c3b'], extras: [{ k: 'poly', pts: '15,2.5 27.5,10 15,17.5 2.5,10', c: '#ffdf00' }, circle(15, 10, 4.4, '#002776')] },
  ar: { stripes: ['#74acdf', W, '#74acdf'], extras: [circle(15, 10, 1.9, '#f6b40e')] },
  pe: { stripes: ['#d91023', W, '#d91023'], vertical: true },
  cl: { stripes: [W, '#d52b1e'], extras: [rect(0, 0, 10, 10, '#0039a6'), star(5, 5, 2.6, W)] },
  cn: { stripes: ['#ee1c25'], extras: [star(5, 5, 3, '#ffff00'), star(10, 2, 1, '#ffff00'), star(12, 4, 1, '#ffff00'), star(12, 7, 1, '#ffff00'), star(10, 9, 1, '#ffff00')] },
  jp: { stripes: [W], extras: [circle(15, 10, 6, '#bc002d')] },
  kr: {
    stripes: [W],
    extras: [circle(15, 10, 5, '#0047a0'), { k: 'path', d: 'M10,10 A5,5 0 0 1 20,10 Z', c: '#cd2e3a' }, rect(3.5, 3, 3.5, 1, '#000000'), rect(23, 3, 3.5, 1, '#000000'), rect(3.5, 16, 3.5, 1, '#000000'), rect(23, 16, 3.5, 1, '#000000')],
  },
  in: { stripes: ['#ff9933', W, '#138808'], extras: [circle(15, 10, 2.6, '#000080', 0.6)] },
  th: { stripes: ['#a51931', '#f4f5f8', '#2d2a4a', '#f4f5f8', '#a51931'], ratios: [1, 1, 2, 1, 1] },
  id: { stripes: ['#ce1126', W] },
  eg: { stripes: ['#ce1126', W, '#000000'], extras: [rect(14, 8, 2, 4, '#c09300')] },
  ma: { stripes: ['#c1272d'], extras: [star(15, 10.4, 4.6, '#006233', true)] },
  ke: { stripes: ['#000000', W, '#bb0000', W, '#006600'], ratios: [6, 1, 6, 1, 6], extras: [{ k: 'poly', pts: '15,3.5 17.6,10 15,16.5 12.4,10', c: '#bb0000' }, rect(14.6, 4.5, 0.8, 11, '#000000')] },
  ng: { stripes: ['#008751', W, '#008751'], vertical: true },
  au: { stripes: ['#012169'], extras: [{ k: 'jack', w: 15, h: 10 }, star(7.5, 15, 2.4, W), ...SOUTHERN_CROSS(W, 1.1)] },
  nz: { stripes: ['#012169'], extras: [{ k: 'jack', w: 15, h: 10 }, ...SOUTHERN_CROSS('#cc142b', 1.3)] },
};
