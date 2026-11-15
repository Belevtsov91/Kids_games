// Стартовый экран, карта уровней и окно победы.
import { LEVELS } from '../game/levels';
import { isUnlocked, type Progress } from '../game/progress';
import { tr } from '../i18n';
import { FRIEND_ART, PARCEL, ROBOT } from './art';
import { button, el } from './dom';

export function startScreen(childName: string | undefined, onPlay: () => void) {
  const screen = el('section', 'rk-start');
  const hero = el('div', 'rk-hero', `${ROBOT}${PARCEL}`);
  hero.setAttribute('aria-hidden', 'true');
  const parade = el('div', 'rk-parade', Object.values(FRIEND_ART).join(''));
  parade.setAttribute('aria-hidden', 'true');
  screen.append(hero, parade, el('p', 'rk-lead', tr().lead(childName)), button('rk-btn rk-btn-play', tr().play, onPlay));
  return screen;
}

export function levelsScreen(progress: Progress, onPick: (n: number) => void, onBack: () => void) {
  const screen = el('section', 'rk-levels');
  const grid = el('div', 'rk-level-grid');
  for (const level of LEVELS) {
    const open = isUnlocked(progress, level.n);
    const stars = progress.stars[level.n] ?? 0;
    const b = button(`rk-level${open ? '' : ' is-locked'}`, open ? String(level.n) : '🔒', () => open && onPick(level.n));
    b.disabled = !open;
    b.setAttribute('aria-label', tr().level(level.n));
    if (stars) b.append(el('small', 'rk-level-stars', '⭐'.repeat(stars)));
    b.classList.add(level.tools.includes('if') ? 'is-if' : level.tools.includes('loop') ? 'is-loop' : 'is-moves');
    grid.append(b);
  }
  screen.append(button('rk-btn rk-btn-soft rk-btn-small', tr().back, onBack), grid);
  return screen;
}

export function winOverlay(stars: number, last: boolean, onNext: () => void, onAgain: () => void, onMenu: () => void) {
  const overlay = el('div', 'rk-win');
  const card = el('div', 'rk-win-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', tr().bravo);
  const row = el('div', 'rk-stars');
  for (let i = 0; i < 3; i++) {
    const star = el('span', i < stars ? 'is-on' : '', '⭐');
    star.style.animationDelay = `${0.2 + i * 0.2}s`;
    row.append(star);
  }
  const actions = el('div', 'rk-actions');
  const main = last ? button('rk-btn rk-btn-play', tr().menu, onMenu) : button('rk-btn rk-btn-play', tr().next, onNext);
  actions.append(main, button('rk-btn rk-btn-soft', tr().again, onAgain));
  if (!last) actions.append(button('rk-btn rk-btn-soft', tr().menu, onMenu));
  card.append(row, el('h2', '', tr().bravo), el('div', 'rk-win-pot', `${ROBOT}${FRIEND_ART.bear}`));
  if (last) card.append(el('p', '', tr().allDone));
  card.append(actions);
  overlay.append(card);
  return { overlay, focus: () => main.focus({ preventScroll: true }) };
}
