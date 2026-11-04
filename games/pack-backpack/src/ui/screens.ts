// Выбор поездки, экран сборки (картинка поездки, рюкзак, полка) и окно «готово».
import { TRIPS, ITEM_ART, type Trip } from '../game/trips';
import { isOpen, type Progress } from '../game/progress';
import { tr } from '../i18n';
import { button, el } from './dom';

export function tripsScreen(name: string | undefined, p: Progress, onPick: (t: Trip) => void) {
  const screen = el('section', 'pb-trips');
  const grid = el('div', 'pb-grid');
  TRIPS.forEach((t, i) => {
    const open = isOpen(p, i);
    const card = button(`pb-trip${open ? '' : ' is-locked'}`, '', () => open && onPick(t));
    card.disabled = !open;
    card.append(el('span', 'pb-trip-art', open ? t.art : '🔒'), el('span', '', tr().trips[t.id]));
    if (p.done[t.id]) card.append(el('b', 'pb-trip-star', '⭐'));
    grid.append(card);
  });
  screen.append(el('div', 'pb-hero', '🧒🎒'), el('p', 'pb-lead', tr().lead(name)), grid);
  return screen;
}

export class PackView {
  readonly node = el('section', 'pb-pack');
  readonly bag = el('div', 'pb-bag');
  readonly shelf = el('div', 'pb-shelf');
  private readonly inside = el('div', 'pb-inside');
  private readonly count = el('p', 'pb-count');

  constructor(trip: Trip, items: string[], onItem: (id: string, btn: HTMLButtonElement) => void, onBack: () => void) {
    const banner = el('div', 'pb-banner');
    banner.append(el('span', 'pb-banner-art', trip.art), el('span', '', tr().trips[trip.id]));
    this.bag.append(el('span', 'pb-bag-art', '🎒'), this.inside);
    for (const id of items) {
      const b = button('pb-item', ITEM_ART[id], () => onItem(id, b));
      b.setAttribute('aria-label', tr().items[id]);
      this.shelf.append(b);
    }
    this.node.append(button('pb-btn pb-btn-soft pb-btn-small pb-back', tr().back, onBack), banner, this.bag, this.count, this.shelf);
  }

  setCount(n: number, of: number) {
    this.count.textContent = tr().packed(n, of);
  }

  /** Вещь «прыгает» с полки в рюкзак. */
  putIn(id: string, btn: HTMLElement) {
    const from = btn.getBoundingClientRect();
    const to = this.bag.getBoundingClientRect();
    const fly = el('span', 'pb-fly', ITEM_ART[id]);
    fly.style.left = `${from.left + from.width / 2}px`;
    fly.style.top = `${from.top + from.height / 2}px`;
    fly.style.setProperty('--pb-dx', `${to.left + to.width / 2 - (from.left + from.width / 2)}px`);
    fly.style.setProperty('--pb-dy', `${to.top + to.height / 2 - (from.top + from.height / 2)}px`);
    document.body.append(fly);
    fly.addEventListener('animationend', () => fly.remove());
    btn.classList.add('is-packed');
    (btn as HTMLButtonElement).disabled = true;
    this.inside.append(el('span', 'pb-in', ITEM_ART[id]));
    this.bag.classList.remove('is-bounce');
    void this.bag.offsetWidth;
    this.bag.classList.add('is-bounce');
  }
}

export function doneOverlay(trip: Trip, onGo: () => void, onMore: () => void) {
  const overlay = el('div', 'pb-done');
  const card = el('div', 'pb-done-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', tr().doneTitle);
  const walk = el('div', 'pb-walk');
  walk.append(el('span', 'pb-walk-scene', trip.art), el('span', 'pb-walk-kid', '🧒🎒'));
  const go = button('pb-btn pb-btn-play', tr().go, onGo);
  const actions = el('div', 'pb-actions');
  actions.append(go, button('pb-btn pb-btn-soft', tr().more, onMore));
  card.append(walk, el('h2', '', tr().doneTitle), el('div', 'pb-done-items', trip.need.map((i) => ITEM_ART[i]).join(' ')), actions);
  overlay.append(card);
  return { overlay, focus: () => go.focus({ preventScroll: true }) };
}
