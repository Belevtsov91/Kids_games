import { habitats, type Animal, type Habitat } from '../game/data';
import { button, el } from './dom';
import { animalImage } from './art';

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
  const lead = el('p', 'wlw-lead', childName ? `${childName}, помоги зверятам найти свой дом!` : 'Помоги зверятам найти свой дом!');
  const actions = el('div', 'wlw-actions');
  actions.append(button('wlw-btn wlw-btn-play', '▶ Играть', onPlay), button('wlw-btn wlw-btn-soft', '📖 Альбом зверят', onAlbum));
  screen.append(parade, lead, actions);
  return screen;
}

/** Альбом: все зверята по домам; ещё не найденные — под знаком вопроса. */
export function albumScreen(found: ReadonlySet<string>, onBack: () => void, onAnimal: (card: HTMLElement, animal: Animal, home: Habitat, known: boolean) => void) {
  const screen = el('section', 'wlw-album');
  screen.append(button('wlw-btn wlw-btn-soft wlw-btn-small', '‹ Назад', onBack));
  for (const home of habitats) {
    const group = el('div', `wlw-album-home wlw-scene-${home.id}`);
    group.append(el('h2', '', `${home.emoji} ${home.title}`));
    const row = el('div', 'wlw-album-row');
    for (const animal of home.animals) {
      const known = found.has(animal.id);
      const card = el('button', `wlw-album-animal${known ? '' : ' is-unknown'}`);
      card.append(animalImage(animal.id, 'wlw-emoji'), el('small', '', known ? animal.name : '?'));
      card.setAttribute('aria-label', known ? animal.name : 'Ещё не найден');
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
  card.setAttribute('aria-label', 'Победа');
  const starsRow = el('div', 'wlw-stars');
  for (let i = 0; i < 3; i++) {
    const star = el('span', i < stars ? 'is-on' : '', '⭐');
    star.style.animationDelay = `${0.2 + i * 0.2}s`;
    starsRow.append(star);
  }
  const next = button('wlw-btn wlw-btn-play', 'Дальше ▶', onNext);
  const actions = el('div', 'wlw-actions');
  actions.append(next, button('wlw-btn wlw-btn-soft', '🏠 Меню', onMenu));
  card.append(starsRow, el('h2', '', 'Молодец!'), el('p', '', 'Все зверята дома'), actions);
  overlay.append(card);
  return { overlay, focus: () => next.focus({ preventScroll: true }) };
}
