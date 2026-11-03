import { habitats, type Animal, type Habitat } from '../game/data';
import { button, el } from './dom';
import { animalImage } from './art';
import { animalName, homeTitle, tr } from '../i18n';

// Стартовый экран, альбом найденных зверят и окно победы.

export function startScreen(childName: string | undefined, onPlay: () => void, onAlbum: () => void) {
  const screen = el('section', 'wlw-start');
  const parade = el('div', 'wlw-parade');
  parade.setAttribute('aria-hidden', 'true');
  ['cow', 'fox', 'whale', 'penguin', 'lion', 'frog'].forEach((id, i) => {
    const span = el('span');
    span.append(animalImage(id));
    span.style.animationDelay = `${i * 0.15}s`;
    parade.append(span);
  });
  const lead = el('p', 'wlw-lead', tr().lead(childName));
  const actions = el('div', 'wlw-actions');
  actions.append(button('wlw-btn wlw-btn-play', tr().play, onPlay), button('wlw-btn wlw-btn-soft', tr().album, onAlbum));
  screen.append(parade, lead, actions);
  return screen;
}

/** Альбом: все зверята по домам; ещё не найденные — под знаком вопроса. */
export function albumScreen(found: ReadonlySet<string>, onBack: () => void, onAnimal: (card: HTMLElement, animal: Animal, home: Habitat, known: boolean) => void) {
  const screen = el('section', 'wlw-album');
  screen.append(button('wlw-btn wlw-btn-soft wlw-btn-small', tr().back, onBack));
  for (const home of habitats) {
    const group = el('div', `wlw-album-home wlw-scene-${home.id}`);
    group.append(el('h2', '', `${home.emoji} ${homeTitle(home)}`));
    const row = el('div', 'wlw-album-row');
    for (const animal of home.animals) {
      const known = found.has(animal.id);
      const card = el('button', `wlw-album-animal${known ? '' : ' is-unknown'}`);
      card.append(animalImage(animal.id, 'wlw-emoji'), el('small', '', known ? animalName(animal) : '?'));
      card.setAttribute('aria-label', known ? animalName(animal) : tr().notFound);
      card.addEventListener('click', () => onAnimal(card, animal, home, known));
      row.append(card);
    }
    group.append(row);
    screen.append(group);
  }
  return screen;
}

export function winOverlay(stars: number, onNext: () => void, onMenu: () => void) {
  const overlay = el('div', 'wlw-win');
  const card = el('div', 'wlw-win-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', tr().win);
  const starsRow = el('div', 'wlw-stars');
  for (let i = 0; i < 3; i++) {
    const star = el('span', i < stars ? 'is-on' : '', '⭐');
    star.style.animationDelay = `${0.2 + i * 0.2}s`;
    starsRow.append(star);
  }
  const next = button('wlw-btn wlw-btn-play', tr().next, onNext);
  const actions = el('div', 'wlw-actions');
  actions.append(next, button('wlw-btn wlw-btn-soft', tr().menu, onMenu));
  card.append(starsRow, el('h2', '', tr().bravo), el('p', '', tr().allHome), actions);
  overlay.append(card);
  return { overlay, focus: () => next.focus({ preventScroll: true }) };
}
