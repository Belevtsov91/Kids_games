// Стартовый экран, выбор картинки и окно «получилось».
import { PICTURES, type Picture } from '../game/pictures';
import { isOpen, type Progress } from '../game/progress';
import { tr } from '../i18n';
import { button, el } from './dom';
import { pictureSvg } from './svg';

export function startScreen(name: string | undefined, onPictures: () => void, onFree: () => void) {
  const screen = el('section', 'sw-start');
  const hero = el('div', 'sw-hero');
  hero.append(pictureSvg(PICTURES[4].pieces, true, 'sw-hero-art'), pictureSvg(PICTURES[0].pieces, true, 'sw-hero-art'));
  const actions = el('div', 'sw-actions');
  actions.append(button('sw-btn sw-btn-play', `▶ ${tr().pictures}`, onPictures), button('sw-btn sw-btn-soft', tr().free, onFree));
  screen.append(hero, el('p', 'sw-lead', tr().lead(name)), actions);
  return screen;
}

export function picturesScreen(p: Progress, onPick: (pic: Picture) => void, onBack: () => void) {
  const screen = el('section', 'sw-pictures');
  const grid = el('div', 'sw-grid');
  PICTURES.forEach((pic, i) => {
    const open = isOpen(p, i);
    const done = p.done.includes(pic.id);
    const card = button(`sw-card${open ? '' : ' is-locked'}${done ? ' is-done' : ''}`, '', () => open && onPick(pic));
    card.disabled = !open;
    card.append(pictureSvg(pic.pieces, done), el('span', '', open ? tr().names[pic.id] : '🔒'));
    if (done) card.append(el('b', 'sw-card-star', '⭐'));
    card.setAttribute('aria-label', tr().names[pic.id]);
    grid.append(card);
  });
  screen.append(button('sw-btn sw-btn-soft sw-btn-small', tr().back, onBack), grid);
  return screen;
}

export function winOverlay(pic: Picture, hasNext: boolean, onNext: () => void, onMenu: () => void) {
  const overlay = el('div', 'sw-win');
  const card = el('div', 'sw-win-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', tr().bravo);
  const main = hasNext ? button('sw-btn sw-btn-play', tr().next, onNext) : button('sw-btn sw-btn-play', tr().menu, onMenu);
  const actions = el('div', 'sw-actions');
  actions.append(main);
  if (hasNext) actions.append(button('sw-btn sw-btn-soft', tr().menu, onMenu));
  card.append(pictureSvg(pic.pieces, true, 'sw-win-art'), el('h2', '', tr().names[pic.id]), actions);
  overlay.append(card);
  return { overlay, focus: () => main.focus({ preventScroll: true }) };
}
