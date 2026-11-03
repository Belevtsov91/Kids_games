import type { Animal, Habitat } from '../game/data';
import type { Round } from '../game/rounds';
import { el } from './dom';
import { animalImage } from './art';

// Экран раунда: дома сверху, точки прогресса, лоток со зверятами снизу.

export function roundScreen(round: Round, homeCard: (home: Habitat) => HTMLElement, animalToken: (animal: Animal, index: number) => HTMLElement) {
  const screen = el('section', 'wlw-play');
  const homes = el('div', 'wlw-homes');
  homes.dataset.count = String(round.homes.length);
  for (const home of round.homes) homes.append(homeCard(home));

  const dots = el('div', 'wlw-dots');
  dots.setAttribute('aria-label', `Дома 0 из ${round.animals.length}`);
  round.animals.forEach(() => dots.append(el('span')));

  const tray = el('div', 'wlw-tray');
  tray.setAttribute('aria-label', 'Зверята');
  round.animals.forEach((animal, i) => tray.append(animalToken(animal, i)));

  screen.append(homes, dots, tray);
  return screen;
}

/** Карточка дома: по ней можно щёлкнуть, нажать Enter или бросить на неё зверя. */
export function homeCard(home: Habitat, onChoose: (card: HTMLElement) => void) {
  const card = el('div', `wlw-home wlw-scene-${home.id}`);
  card.dataset.home = home.id;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', home.title);
  card.append(el('span', 'wlw-home-title', home.title), el('div', 'wlw-home-residents'));
  card.addEventListener('click', () => onChoose(card));
  card.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onChoose(card)));
  return card;
}

export function animalToken(animal: Animal, index: number) {
  const token = el('button', 'wlw-animal');
  token.dataset.animal = animal.id;
  // Появление — через Web Animations, а не CSS: CSS-анимация перебивала бы transform при перетаскивании.
  if (typeof token.animate === 'function') {
    token.animate([{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], {
      duration: 450,
      delay: index * 60,
      easing: 'cubic-bezier(.3,1.6,.5,1)',
      fill: 'backwards',
    });
  }
  token.setAttribute('aria-label', animal.name);
  token.append(animalImage(animal.id, 'wlw-emoji'), el('span', 'wlw-animal-name', animal.name));
  return token;
}

/** Дом под точкой экрана (с запасом для пальца). */
export function homeAt(stage: HTMLElement, x: number, y: number): HTMLElement | null {
  const pad = 12;
  for (const card of stage.querySelectorAll<HTMLElement>('.wlw-home')) {
    const r = card.getBoundingClientRect();
    if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) return card;
  }
  return null;
}

/**
 * Зверь перелетает из лотка в дом; в лотке остаётся пустое место, чтобы раскладка не прыгала.
 * `onLand` получает точку посадки относительно `root` (для искр).
 */
export function flyHome(root: HTMLElement, token: HTMLButtonElement, animal: Animal, homeCard: HTMLElement, onLand: (x: number, y: number) => void) {
  const residents = homeCard.querySelector<HTMLElement>('.wlw-home-residents')!;
  const resident = el('span', 'wlw-resident');
  resident.append(animalImage(animal.id));
  resident.setAttribute('aria-label', animal.name);
  resident.style.visibility = 'hidden';
  residents.append(resident);

  const rootBox = root.getBoundingClientRect();
  const from = token.querySelector('.wlw-emoji')!.getBoundingClientRect();
  const to = resident.getBoundingClientRect();
  token.classList.remove('is-dragging');
  token.style.transform = '';
  token.classList.add('is-gone');
  token.disabled = true;

  const flyer = el('span', 'wlw-flyer');
  flyer.append(animalImage(animal.id));
  Object.assign(flyer.style, { left: `${from.left - rootBox.left}px`, top: `${from.top - rootBox.top}px`, width: `${from.width}px`, height: `${from.height}px` });
  root.append(flyer);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const scale = to.height / from.height;
  const land = () => {
    flyer.remove();
    resident.style.visibility = '';
    resident.classList.add('is-new');
    onLand(to.left - rootBox.left + to.width / 2, to.top - rootBox.top + to.height / 2);
  };
  if (typeof flyer.animate !== 'function') return land();
  const animation = flyer.animate(
    [
      { transform: 'translate(0, 0) scale(1.15)' },
      { transform: `translate(${dx / 2}px, ${dy / 2 - 60}px) scale(${(1.15 + scale) / 2 + 0.2})`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
    ],
    { duration: 520, easing: 'cubic-bezier(.3,.7,.4,1)' },
  );
  animation.onfinish = land;
  animation.oncancel = land;
}
