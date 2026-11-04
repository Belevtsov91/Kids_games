// Медвежонок Тёпа — своя рисованная SVG-фигура: мягкие плоские формы без обводок, как обложки сайта.
import type { Pajama } from '../game/logic';

export type BearMood = 'happy' | 'sleepy' | 'asleep' | 'munch';

const FUR = '#c98f66';
const FUR_DARK = '#b9805a';
const MUZZLE = '#f0c9a5';
const INK = '#3b2a4a';

/** Узор пижамы: повторяющийся рисунок внутри <pattern>. */
const PATTERNS: Record<Pajama, { bg: string; tile: string }> = {
  stars: { bg: '#8fb8ff', tile: '<path d="M10 4l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L4.2 8.2l4-.6z" fill="#ffe27a"/>' },
  dots: { bg: '#ffb3c7', tile: '<circle cx="6" cy="6" r="3" fill="#fff"/><circle cx="16" cy="15" r="3" fill="#fff"/>' },
  stripes: { bg: '#a8e6b8', tile: '<rect width="20" height="6" fill="#6cc488"/>' },
  hearts: { bg: '#ffd8a8', tile: '<path d="M10 15s-6-3.6-6-7.4A3 3 0 0 1 10 6a3 3 0 0 1 6 1.6C16 11.4 10 15 10 15z" fill="#ff7b9c"/>' },
  moons: { bg: '#c3b2ff', tile: '<path d="M12 4a6 6 0 1 0 4 10A5 5 0 0 1 12 4z" fill="#fff6c9"/>' },
};

const eyes = (mood: BearMood) =>
  mood === 'asleep' || mood === 'sleepy'
    ? `<path d="M80 92q8 6 16 0M124 92q8 6 16 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`
    : `<circle cx="88" cy="90" r="7" fill="${INK}"/><circle cx="132" cy="90" r="7" fill="${INK}"/><circle cx="90" cy="87" r="2.4" fill="#fff"/><circle cx="134" cy="87" r="2.4" fill="#fff"/>`;

const mouth = (mood: BearMood) =>
  mood === 'munch'
    ? `<ellipse cx="110" cy="122" rx="9" ry="7" fill="${INK}"/>`
    : mood === 'sleepy'
      ? `<ellipse cx="110" cy="124" rx="6" ry="8" fill="${INK}"/>`
      : `<path d="M100 120q10 9 20 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;

/** Тёпа целиком. pajama=null — без пижамы (ужин, купание). dirty — грязные лапки (купание). */
export function bearSvg(opts: { mood?: BearMood; pajama?: Pajama | null; id?: string } = {}) {
  const mood = opts.mood ?? 'happy';
  const id = opts.id ?? 'bear';
  const pj = opts.pajama ? PATTERNS[opts.pajama] : null;
  const body = pj ? `url(#${id}-pj)` : FUR;
  return `<svg viewBox="0 0 220 260" class="bear bear-${mood}" aria-hidden="true">
  ${pj ? `<defs><pattern id="${id}-pj" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="${pj.bg}"/>${pj.tile}</pattern></defs>` : ''}
  <g class="bear-body">
    <ellipse cx="62" cy="228" rx="26" ry="18" fill="${FUR_DARK}"/><ellipse cx="158" cy="228" rx="26" ry="18" fill="${FUR_DARK}"/>
    <path d="M58 150q52-26 104 0l8 74q-60 18-120 0z" fill="${body}"/>
    <ellipse cx="110" cy="196" rx="30" ry="26" fill="${pj ? 'rgba(255,255,255,.35)' : MUZZLE}"/>
    <ellipse cx="44" cy="176" rx="17" ry="28" fill="${pj ? body : FUR}" transform="rotate(20 44 176)"/>
    <ellipse cx="176" cy="176" rx="17" ry="28" fill="${pj ? body : FUR}" transform="rotate(-20 176 176)"/>
  </g>
  <g class="bear-head">
    <circle cx="62" cy="46" r="22" fill="${FUR_DARK}"/><circle cx="158" cy="46" r="22" fill="${FUR_DARK}"/>
    <circle cx="62" cy="46" r="11" fill="${MUZZLE}"/><circle cx="158" cy="46" r="11" fill="${MUZZLE}"/>
    <circle cx="110" cy="90" r="58" fill="${FUR}"/>
    <ellipse cx="110" cy="112" rx="26" ry="20" fill="${MUZZLE}"/>
    ${eyes(mood)}
    <ellipse cx="110" cy="104" rx="9" ry="6.5" fill="${INK}"/>
    ${mouth(mood)}
    <circle cx="74" cy="108" r="9" fill="#ff9aa8" opacity=".55"/><circle cx="146" cy="108" r="9" fill="#ff9aa8" opacity=".55"/>
  </g>
  ${mood === 'asleep' ? `<g class="bear-z" fill="#cfc3ff" font-family="system-ui" font-weight="800"><text x="170" y="40" font-size="26">z</text><text x="188" y="18" font-size="18">z</text></g>` : ''}
</svg>`;
}

/** Грязное пятно на лапке (купание). */
export const mudSvg = () =>
  `<svg viewBox="0 0 60 50" aria-hidden="true"><path d="M8 26c-4-12 10-20 20-16 8-8 24-2 22 10 10 6 4 22-10 20-8 8-26 6-28-4C2 36 2 30 8 26z" fill="#8a5a3a"/><circle cx="20" cy="22" r="4" fill="#6b4329"/><circle cx="38" cy="30" r="5" fill="#6b4329"/></svg>`;

/** Зубки Тёпы: открытый рот крупно, пять зубов — отдельные элементы поверх. */
export const mouthSvg = () =>
  `<svg viewBox="0 0 400 220" aria-hidden="true"><ellipse cx="200" cy="110" rx="190" ry="100" fill="${FUR}"/><ellipse cx="200" cy="120" rx="150" ry="70" fill="#7a2a3a"/><ellipse cx="200" cy="160" rx="80" ry="26" fill="#ff8fa3"/></svg>`;
