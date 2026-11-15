// Рисунки Эко-города: мягкие плоские SVG без обводок, как остров на обложке.
import type { HouseKind, Tool } from '../game/types';

const ROOFS = ['#ff7a59', '#5b7cfa', '#4fc3a1', '#ffb547'];

const win = (x: number, y: number) => `<rect class="eco-win" x="${x}" y="${y}" width="12" height="12" rx="2"/>`;

/** Дом: цвет крыши зависит от номера клетки, чтобы квартал был пёстрым. */
export function houseSvg(kind: HouseKind, seed: number) {
  const roof = ROOFS[seed % ROOFS.length];
  if (kind === 'tower')
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <rect x="28" y="14" width="44" height="80" rx="5" fill="#e8f4ff"/>
      <rect x="24" y="8" width="52" height="10" rx="4" fill="${roof}"/>
      ${[26, 42, 58, 74].map((y) => win(36, y) + win(52, y)).join('')}
    </svg>`;
  if (kind === 'school')
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <rect x="12" y="44" width="76" height="48" rx="5" fill="#fff1dc"/>
      <path d="M6 46 50 18l44 28z" fill="${roof}"/>
      <circle cx="50" cy="36" r="6" fill="#fff6c9"/>
      ${win(20, 56)}${win(36, 56)}${win(52, 56)}${win(68, 56)}
      <rect x="44" y="72" width="12" height="20" rx="2" fill="#c98f66"/>
    </svg>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <rect x="22" y="46" width="56" height="46" rx="6" fill="#fff6e8"/>
    <path d="M14 50 50 16l36 34z" fill="${roof}"/>
    ${win(32, 58)}${win(56, 58)}
    <rect x="44" y="74" width="12" height="18" rx="2" fill="#c98f66"/>
  </svg>`;
}

const SOLAR = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <rect x="47" y="58" width="6" height="30" rx="2" fill="#9aa3b5"/>
  <g transform="skewX(-12) translate(14 0)">
    <rect x="12" y="30" width="70" height="36" rx="5" fill="#2c4a9a"/>
    <path d="M35 30v36M58 30v36M12 48h70" stroke="#6f8fe0" stroke-width="2"/>
    <rect class="eco-shine" x="16" y="33" width="18" height="12" rx="2" fill="#9db8ff" opacity=".5"/>
  </g>
</svg>`;

const WIND = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <path d="M47 34h6l3 60h-12z" fill="#ffffff"/>
  <g class="eco-blades">
    <path d="M50 32 46 4q4-3 8 0z" fill="#ffffff"/>
    <path d="M50 32 46 4q4-3 8 0z" fill="#ffffff" transform="rotate(120 50 32)"/>
    <path d="M50 32 46 4q4-3 8 0z" fill="#ffffff" transform="rotate(240 50 32)"/>
    <circle cx="50" cy="32" r="5" fill="#dfe6f2"/>
  </g>
</svg>`;

const BATTERY = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <rect x="40" y="10" width="20" height="8" rx="3" fill="#cfd5e2"/>
  <rect x="26" y="16" width="48" height="76" rx="10" fill="#ffffff" opacity=".75"/>
  <rect class="eco-cell" x="32" y="22" width="36" height="64" rx="6" fill="#5be36b"/>
</svg>`;

export const toolSvg = (tool: Tool) => (tool === 'solar' ? SOLAR : tool === 'wind' ? WIND : BATTERY);

const FUR = '#c98f66';
const DARK = '#b9805a';
const MUZZLE = '#f0c9a5';
const INK = '#3b2a4a';

/** Тёпа в розовом шарфике. mood: happy — улыбается, worry — удивлён (свет погас). */
export function bearSvg(mood: 'happy' | 'worry' = 'happy') {
  const mouth =
    mood === 'worry'
      ? `<ellipse cx="60" cy="68" rx="5" ry="6" fill="${INK}"/>`
      : `<path d="M53 66q7 7 14 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 120 140" class="eco-bear-svg" aria-hidden="true">
    <ellipse cx="36" cy="126" rx="15" ry="10" fill="${DARK}"/><ellipse cx="84" cy="126" rx="15" ry="10" fill="${DARK}"/>
    <path d="M32 84q28-14 56 0l5 40q-33 10-66 0z" fill="${FUR}"/>
    <ellipse cx="60" cy="106" rx="17" ry="14" fill="${MUZZLE}"/>
    <ellipse cx="26" cy="98" rx="10" ry="16" fill="${FUR}" transform="rotate(20 26 98)"/>
    <ellipse cx="94" cy="98" rx="10" ry="16" fill="${FUR}" transform="rotate(-20 94 98)"/>
    <circle cx="34" cy="22" r="13" fill="${DARK}"/><circle cx="86" cy="22" r="13" fill="${DARK}"/>
    <circle cx="34" cy="22" r="6" fill="${MUZZLE}"/><circle cx="86" cy="22" r="6" fill="${MUZZLE}"/>
    <circle cx="60" cy="50" r="33" fill="${FUR}"/>
    <ellipse cx="60" cy="62" rx="15" ry="11" fill="${MUZZLE}"/>
    <ellipse cx="60" cy="56" rx="5" ry="4" fill="${INK}"/>
    <circle cx="48" cy="46" r="4" fill="${INK}"/><circle cx="72" cy="46" r="4" fill="${INK}"/>
    <circle cx="40" cy="60" r="5" fill="#ff9db0" opacity=".7"/><circle cx="80" cy="60" r="5" fill="#ff9db0" opacity=".7"/>
    ${mouth}
    <path d="M34 82q26 12 52 0l-2 8q-24 9-48 0z" fill="#ff7ea8"/>
    <path d="M74 86l8 22-9-2-4-18z" fill="#ff7ea8"/>
  </svg>`;
}

export const SUN_ICON = '☀️';
export const WIND_ICON = '🌬️';
export const BOLT = '⚡';
export const COIN = '🪙';
