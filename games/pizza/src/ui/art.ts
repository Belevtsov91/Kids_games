// Картинки: медвежонок Тёпа в колпаке и розовом шарфике (как на обложке), гости-зверята, печь.
import type { Guest } from '../game/orders';

export const GUEST_ART: Record<Guest, string> = {
  fox: '🦊', rabbit: '🐰', owl: '🦉', squirrel: '🐿️', hedgehog: '🦔', frog: '🐸', raccoon: '🦝',
};

/** Тёпа: SVG без файлов, чтобы игра не зависела от картинок. */
export const TYOPA = `<svg viewBox="0 0 120 150" aria-hidden="true" class="pz-tyopa-art">
  <ellipse cx="60" cy="146" rx="34" ry="4" fill="rgb(0 0 0 / .12)"/>
  <ellipse cx="60" cy="112" rx="30" ry="32" fill="#b06a3b"/>
  <ellipse cx="60" cy="118" rx="18" ry="20" fill="#f2c8a0"/>
  <ellipse cx="36" cy="140" rx="11" ry="7" fill="#9a5a30"/>
  <ellipse cx="84" cy="140" rx="11" ry="7" fill="#9a5a30"/>
  <circle cx="32" cy="50" r="11" fill="#9a5a30"/><circle cx="88" cy="50" r="11" fill="#9a5a30"/>
  <circle cx="32" cy="50" r="5" fill="#e8a27a"/><circle cx="88" cy="50" r="5" fill="#e8a27a"/>
  <circle cx="60" cy="66" r="30" fill="#b06a3b"/>
  <ellipse cx="60" cy="76" rx="14" ry="10" fill="#f2c8a0"/>
  <circle cx="49" cy="62" r="4" fill="#2b2d42"/><circle cx="71" cy="62" r="4" fill="#2b2d42"/>
  <circle cx="50.5" cy="60.5" r="1.3" fill="#fff"/><circle cx="72.5" cy="60.5" r="1.3" fill="#fff"/>
  <ellipse cx="60" cy="72" rx="5" ry="3.6" fill="#2b2d42"/>
  <path d="M55 79 q5 5 10 0" stroke="#2b2d42" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <circle cx="41" cy="74" r="5" fill="#ff8fa3" opacity=".6"/><circle cx="79" cy="74" r="5" fill="#ff8fa3" opacity=".6"/>
  <path d="M34 94 q26 14 52 0 l-4 10 q-22 10 -44 0z" fill="#ff7eb3"/>
  <circle cx="48" cy="100" r="2.5" fill="#fff" opacity=".8"/><circle cx="66" cy="102" r="2.5" fill="#fff" opacity=".8"/>
  <rect x="38" y="30" width="44" height="14" rx="5" fill="#fffaf2"/>
  <circle cx="44" cy="22" r="13" fill="#fffaf2"/><circle cx="60" cy="14" r="15" fill="#fffaf2"/><circle cx="76" cy="22" r="13" fill="#fffaf2"/>
</svg>`;

/** Печь с огоньком: показываем, пока пицца печётся. */
export const OVEN = `<svg viewBox="0 0 120 100" aria-hidden="true">
  <rect x="50" y="2" width="12" height="24" rx="4" fill="#c76b4f"/>
  <path d="M10 96 V52 a50 44 0 0 1 100 0 V96z" fill="#e9876b"/>
  <path d="M34 96 V66 a26 22 0 0 1 52 0 V96z" fill="#5b2d22"/>
  <path class="pz-flame" d="M60 94 c-14 0 -16 -12 -8 -20 c0 6 4 8 6 6 c-4 -10 4 -18 8 -22 c0 10 12 14 8 26 c-2 6 -6 10 -14 10z" fill="#ffb347"/>
</svg>`;
