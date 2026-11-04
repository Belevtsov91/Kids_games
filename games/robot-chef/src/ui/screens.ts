// Стартовый экран, карта уровней и окно победы.
import { LEVELS } from '../game/levels';
import { isUnlocked, type Progress } from '../game/progress';
import { tr } from '../i18n';
import { FOOD_ART, POT, ROBOT } from './art';
import { button, el } from './dom';

export function startScreen(childName: string | undefined, onPlay: () => void) {
  const screen = el('section', 'rc-start');
  const hero = el('div', 'rc-hero', `${ROBOT}${POT}`);
  hero.setAttribute('aria-hidden', 'true');
  const parade = el('div', 'rc-parade', Object.values(FOOD_ART).join(''));
  parade.setAttribute('aria-hidden', 'true');
  screen.append(hero, parade, el('p', 'rc-lead', tr().lead(childName)), button('rc-btn rc-btn-play', tr().play, onPlay));
  return screen;
}

export function levelsScreen(progress: Progress, onPick: (n: number) => void, onBack: () => void) {
  const screen = el('section', 'rc-levels');
  const grid = el('div', 'rc-level-grid');
  for (const level of LEVELS) {
    const open = isUnlocked(progress, level.n);
    const stars = progress.stars[level.n] ?? 0;
    const b = button(`rc-level${open ? '' : ' is-locked'}`, open ? String(level.n) : '🔒', () => open && onPick(level.n));
    b.disabled = !open;
    b.setAttribute('aria-label', tr().level(level.n));
    if (stars) b.append(el('small', 'rc-level-stars', '⭐'.repeat(stars)));
    if (level.repeat) b.classList.add('is-repeat');
    grid.append(b);
  }
  screen.append(button('rc-btn rc-btn-soft rc-btn-small', tr().back, onBack), grid);
  return screen;
}

export function winOverlay(stars: number, last: boolean, onNext: () => void, onAgain: () => void, onMenu: () => void) {
  const overlay = el('div', 'rc-win');
  const card = el('div', 'rc-win-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', tr().bravo);
  const row = el('div', 'rc-stars');
  for (let i = 0; i < 3; i++) {
    const star = el('span', i < stars ? 'is-on' : '', '⭐');
    star.style.animationDelay = `${0.2 + i * 0.2}s`;
    row.append(star);
  }
  const actions = el('div', 'rc-actions');
  const main = last ? button('rc-btn rc-btn-play', tr().menu, onMenu) : button('rc-btn rc-btn-play', tr().next, onNext);
  actions.append(main, button('rc-btn rc-btn-soft', tr().again, onAgain));
  if (!last) actions.append(button('rc-btn rc-btn-soft', tr().menu, onMenu));
  card.append(row, el('h2', '', tr().bravo), el('div', 'rc-win-pot', `${ROBOT}${POT}`));
  if (last) card.append(el('p', '', tr().allDone));
  card.append(actions);
  overlay.append(card);
  return { overlay, focus: () => main.focus({ preventScroll: true }) };
}
