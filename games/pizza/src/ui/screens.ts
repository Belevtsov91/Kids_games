// Стартовый экран, карта уровней и окно победы.
import { LEVELS } from '../game/levels';
import { isUnlocked, type Progress } from '../game/progress';
import { tr } from '../i18n';
import { TYOPA } from './art';
import { button, el } from './dom';

export function startScreen(childName: string | undefined, onPlay: () => void) {
  const screen = el('section', 'pz-start');
  const hero = el('div', 'pz-hero');
  hero.innerHTML = `${TYOPA}<span class="pz-hero-pizza">🍕</span>`;
  hero.setAttribute('aria-hidden', 'true');
  screen.append(hero, el('p', 'pz-lead', tr().lead(childName)), button('pz-btn pz-btn-play', tr().play, onPlay));
  return screen;
}

export function levelsScreen(progress: Progress, onPick: (n: number) => void, onBack: () => void) {
  const screen = el('section', 'pz-levels');
  const grid = el('div', 'pz-level-grid');
  for (const level of LEVELS) {
    const open = isUnlocked(progress, level.n);
    const stars = progress.stars[level.n] ?? 0;
    const b = button(`pz-level${open ? '' : ' is-locked'}`, open ? String(level.n) : '🔒', () => open && onPick(level.n));
    b.disabled = !open;
    b.setAttribute('aria-label', tr().level(level.n));
    if (open) b.append(el('small', 'pz-level-dens', level.dens.map((d) => `1/${d}`).join(' ')));
    if (stars) b.append(el('small', 'pz-level-stars', '⭐'.repeat(stars)));
    grid.append(b);
  }
  screen.append(button('pz-btn pz-btn-soft pz-btn-small', tr().back, onBack), grid);
  return screen;
}

export function winOverlay(stars: number, last: boolean, onNext: () => void, onAgain: () => void, onMenu: () => void) {
  const overlay = el('div', 'pz-win');
  const card = el('div', 'pz-win-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', tr().bravo);
  const row = el('div', 'pz-stars');
  for (let i = 0; i < 3; i++) {
    const star = el('span', i < stars ? 'is-on' : '', '⭐');
    star.style.animationDelay = `${0.2 + i * 0.2}s`;
    row.append(star);
  }
  const actions = el('div', 'pz-actions');
  const main = last ? button('pz-btn pz-btn-play', tr().menu, onMenu) : button('pz-btn pz-btn-play', tr().next, onNext);
  actions.append(main, button('pz-btn pz-btn-soft', tr().again, onAgain));
  if (!last) actions.append(button('pz-btn pz-btn-soft', tr().menu, onMenu));
  const hero = el('div', 'pz-win-hero');
  hero.innerHTML = `${TYOPA}<span class="pz-hero-pizza">🍕</span>`;
  card.append(row, el('h2', '', tr().bravo), hero);
  if (last) card.append(el('p', '', tr().allDone));
  card.append(actions);
  overlay.append(card);
  return { overlay, focus: () => main.focus({ preventScroll: true }) };
}
