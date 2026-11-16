// Медвежонок Тёпа с розовым шарфиком — плоская SVG-фигура в стиле обложек сайта.

export type BearMood = 'happy' | 'sleepy' | 'asleep' | 'oops';

const FUR = '#c98f66';
const FUR_DARK = '#b9805a';
const MUZZLE = '#f0c9a5';
const INK = '#3b2a4a';
const SCARF = '#ff8fb3';

const eyes = (mood: BearMood) =>
  mood === 'asleep' || mood === 'sleepy'
    ? `<path d="M80 92q8 6 16 0M124 92q8 6 16 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`
    : `<circle cx="88" cy="90" r="7" fill="${INK}"/><circle cx="132" cy="90" r="7" fill="${INK}"/><circle cx="90" cy="87" r="2.4" fill="#fff"/><circle cx="134" cy="87" r="2.4" fill="#fff"/>`;

const mouth = (mood: BearMood) =>
  mood === 'oops'
    ? `<path d="M100 124q10-7 20 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`
    : mood === 'sleepy'
      ? `<ellipse cx="110" cy="124" rx="6" ry="8" fill="${INK}"/>`
      : `<path d="M100 120q10 9 20 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;

export function bearSvg(mood: BearMood = 'happy') {
  return `<svg viewBox="0 0 220 260" class="wc-bear-svg wc-bear-${mood}" aria-hidden="true">
  <g class="wc-bear-body">
    <ellipse cx="62" cy="228" rx="26" ry="18" fill="${FUR_DARK}"/><ellipse cx="158" cy="228" rx="26" ry="18" fill="${FUR_DARK}"/>
    <path d="M58 150q52-26 104 0l8 74q-60 18-120 0z" fill="${FUR}"/>
    <ellipse cx="110" cy="196" rx="30" ry="26" fill="${MUZZLE}"/>
    <ellipse cx="44" cy="176" rx="17" ry="28" fill="${FUR}" transform="rotate(20 44 176)"/>
    <ellipse cx="176" cy="176" rx="17" ry="28" fill="${FUR}" transform="rotate(-20 176 176)"/>
    <path d="M66 146q44 20 88 0l-4 16q-40 16-80 0z" fill="${SCARF}"/>
    <path d="M128 156l14 44-16 2-8-42z" fill="${SCARF}"/>
  </g>
  <g class="wc-bear-head">
    <circle cx="62" cy="46" r="22" fill="${FUR_DARK}"/><circle cx="158" cy="46" r="22" fill="${FUR_DARK}"/>
    <circle cx="62" cy="46" r="11" fill="${MUZZLE}"/><circle cx="158" cy="46" r="11" fill="${MUZZLE}"/>
    <circle cx="110" cy="90" r="58" fill="${FUR}"/>
    <ellipse cx="110" cy="112" rx="26" ry="20" fill="${MUZZLE}"/>
    ${eyes(mood)}
    <ellipse cx="110" cy="104" rx="9" ry="6.5" fill="${INK}"/>
    ${mouth(mood)}
    <circle cx="74" cy="108" r="9" fill="#ff9aa8" opacity=".55"/><circle cx="146" cy="108" r="9" fill="#ff9aa8" opacity=".55"/>
  </g>
  ${mood === 'asleep' ? `<g fill="#cfc3ff" font-family="system-ui" font-weight="800"><text x="170" y="40" font-size="26">z</text><text x="188" y="18" font-size="18">z</text></g>` : ''}
</svg>`;
}
