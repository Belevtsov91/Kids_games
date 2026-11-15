// Медвежонок Тёпа в розовом шарфике (как на обложке) и его мама — плоские SVG-фигуры без обводок.

const INK = '#3b2a4a';

export interface BearLook {
  fur: string;
  furDark: string;
  muzzle: string;
  scarf: string | null;
  bow: string | null;
}

export const TYOPA: BearLook = { fur: '#c98f66', furDark: '#b9805a', muzzle: '#f0c9a5', scarf: '#ff8fb8', bow: null };
export const MAMA: BearLook = { fur: '#a8754f', furDark: '#946344', muzzle: '#ebc39d', scarf: null, bow: '#ff6f91' };

const scarfSvg = (color: string) =>
  `<path d="M52 140q58 26 116 0l4 18q-62 26-124 0z" fill="${color}"/><path d="M140 150l18 44-22 4-10-42z" fill="${color}"/><circle cx="72" cy="150" r="4" fill="#fff" opacity=".7"/><circle cx="100" cy="158" r="4" fill="#fff" opacity=".7"/><circle cx="128" cy="156" r="4" fill="#fff" opacity=".7"/>`;

const bowSvg = (color: string) =>
  `<path d="M150 30l-22 14 22 14zM166 30l22 14-22 14z" fill="${color}"/><circle cx="158" cy="44" r="8" fill="${color}"/>`;

/** Медведь целиком: ноги, тело с животиком, лапки, голова. waving — лапка поднята. */
export function bearSvg(look: BearLook = TYOPA, waving = false) {
  const arm = waving
    ? `<ellipse cx="184" cy="128" rx="16" ry="28" fill="${look.fur}" transform="rotate(30 184 128)"/>`
    : `<ellipse cx="176" cy="176" rx="17" ry="28" fill="${look.fur}" transform="rotate(-20 176 176)"/>`;
  return `<svg viewBox="0 0 220 250" class="sr-bear-svg" aria-hidden="true">
  <ellipse cx="110" cy="244" rx="70" ry="6" fill="#000" opacity=".12"/>
  <ellipse cx="66" cy="226" rx="26" ry="17" fill="${look.furDark}"/><ellipse cx="154" cy="226" rx="26" ry="17" fill="${look.furDark}"/>
  <path d="M58 146q52-26 104 0l8 76q-60 18-120 0z" fill="${look.fur}"/>
  <ellipse cx="110" cy="194" rx="30" ry="26" fill="${look.muzzle}"/>
  <ellipse cx="44" cy="176" rx="17" ry="28" fill="${look.fur}" transform="rotate(20 44 176)"/>
  ${arm}
  <circle cx="62" cy="46" r="22" fill="${look.furDark}"/><circle cx="158" cy="46" r="22" fill="${look.furDark}"/>
  <circle cx="62" cy="46" r="11" fill="${look.muzzle}"/><circle cx="158" cy="46" r="11" fill="${look.muzzle}"/>
  <circle cx="110" cy="90" r="58" fill="${look.fur}"/>
  <ellipse cx="110" cy="112" rx="26" ry="20" fill="${look.muzzle}"/>
  <circle cx="88" cy="90" r="7" fill="${INK}"/><circle cx="132" cy="90" r="7" fill="${INK}"/>
  <circle cx="90" cy="87" r="2.4" fill="#fff"/><circle cx="134" cy="87" r="2.4" fill="#fff"/>
  <ellipse cx="110" cy="104" rx="9" ry="6.5" fill="${INK}"/>
  <path d="M100 120q10 9 20 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="74" cy="108" r="9" fill="#ff9aa8" opacity=".55"/><circle cx="146" cy="108" r="9" fill="#ff9aa8" opacity=".55"/>
  ${look.scarf ? scarfSvg(look.scarf) : ''}
  ${look.bow ? bowSvg(look.bow) : ''}
</svg>`;
}
