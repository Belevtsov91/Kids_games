import { levels } from '../game/levels';
import { isUnlocked } from '../game/scoring';
import { escapeHtml } from './dom';
import { levelText, tr } from '../i18n';

// Экран-карта: планеты-уровни со звёздами.

const PLANET_COLORS = [
  ['#7ee7ff', '#2f8ef0'],
  ['#c7a6ff', '#7a4ee8'],
  ['#ffb3d1', '#e8578f'],
  ['#ffd27e', '#e8902f'],
  ['#9ff2b4', '#2fb85b'],
  ['#ffa98a', '#e2553a'],
  ['#e6e6ff', '#8c8cc8'],
  ['#b0f0ff', '#3fa6c4'],
  ['#ffe48a', '#c9a12f'],
  ['#ff9be0', '#a03fe0'],
];

/** `stars` — лучшие звёзды по уровням, `name` — имя ребёнка из профиля. */
export function levelMapHtml(stars: readonly number[], name: string | undefined) {
  const total = stars.reduce((a, b) => a + b, 0);
  const current = stars.findIndex((s) => s === 0);
  return `
    <div class="sg-map-inner">
      <h1>${tr().title}</h1>
      <p class="sg-sub">${tr().intro(name ? escapeHtml(name) : '')}</p>
      <div class="sg-total"><span>⭐ ${total} / ${levels.length * 3}</span></div>
      <div class="sg-levels">
        ${levels.map((level, i) => levelButton(levelText(level).name, i, stars, i === current)).join('')}
      </div>
    </div>`;
}

function levelButton(name: string, i: number, stars: readonly number[], current: boolean) {
  const open = isUnlocked(i, stars);
  const [light, dark] = PLANET_COLORS[i % PLANET_COLORS.length];
  const starRow = [1, 2, 3].map((n) => `<span class="${stars[i] >= n ? '' : 'off'}">⭐</span>`).join('');
  return `
    <button class="sg-level${current ? ' sg-level-current' : ''}" data-act="level" data-index="${i}" ${open ? '' : 'disabled'}
      aria-label="${tr().level(i + 1, escapeHtml(name), open ? stars[i] : null)}">
      <span class="sg-planet" style="background: radial-gradient(circle at 30% 30%, ${light}, ${dark})">${open ? i + 1 : '🔒'}</span>
      <span class="sg-level-name">${escapeHtml(name)}</span>
      <span class="sg-level-stars" aria-hidden="true">${starRow}</span>
    </button>`;
}
