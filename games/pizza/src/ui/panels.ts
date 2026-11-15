// Панели кухни: чек заказа, нож (нарезка), лоток с начинками и счётчик долей под пиццей.
import { countOf, type Pizza } from '../game/check';
import { simplify, type Frac } from '../game/fractions';
import { CUTS } from '../game/levels';
import { plainShare, type Order } from '../game/orders';
import { TOPPING_ART, TOPPINGS, type Topping } from '../game/toppings';
import { tr } from '../i18n';
import { GUEST_ART } from './art';
import { button, el } from './dom';

/** Дробь столбиком: числитель над знаменателем. */
export function fracView(f: Frac) {
  const node = el('span', 'pz-frac');
  node.append(el('b', '', String(f.n)), el('i', '', String(f.d)));
  node.setAttribute('aria-label', `${f.n}/${f.d}`);
  return node;
}

export function ticketView(order: Order, index: number, of: number) {
  const card = el('section', 'pz-ticket');
  const guest = tr().guests[order.guest];
  const head = el('div', 'pz-ticket-head');
  head.append(el('span', 'pz-guest', GUEST_ART[order.guest]), el('div', 'pz-ticket-title', tr().orderFrom(guest)));
  card.append(el('small', 'pz-ticket-no', tr().orderNo(index, of)), head);
  const list = el('ul', 'pz-ticket-list');
  for (const part of order.parts) {
    const li = el('li', '');
    li.append(el('span', 'pz-ticket-emoji', TOPPING_ART[part.topping].emoji), el('span', 'pz-ticket-name', tr().toppings[part.topping]));
    li.append(part.rest ? el('span', 'pz-ticket-rest', tr().rest) : fracView(part.share));
    list.append(li);
  }
  const plain = plainShare(order.parts);
  if (plain.n > 0) {
    const li = el('li', 'is-plain');
    li.append(el('span', 'pz-ticket-emoji', '⚪'), el('span', 'pz-ticket-name', tr().plain), el('span', 'pz-ticket-rest', tr().rest));
    list.append(li);
  }
  card.append(list);
  return card;
}

/** Нож: кнопки «на сколько частей». При готовой нарезке — только подпись. */
export function knifeView(fixed: number | null, current: number, onCut: (k: number) => void) {
  const box = el('section', 'pz-knife');
  box.append(el('h3', 'pz-panel-title', `🔪 ${tr().cutTitle}`));
  if (fixed) {
    box.append(el('p', 'pz-knife-note', tr().cutFixed(fixed)));
    return box;
  }
  const row = el('div', 'pz-knife-row');
  for (const k of CUTS) {
    const b = button(`pz-chip${k === current ? ' is-on' : ''}`, String(k), () => onCut(k));
    b.setAttribute('aria-pressed', String(k === current));
    row.append(b);
  }
  box.append(row);
  return box;
}

/** Лоток с начинками и ластиком. null — ластик. */
export function trayView(selected: Topping | null, onPick: (t: Topping | null) => void) {
  const box = el('section', 'pz-tray');
  box.append(el('h3', 'pz-panel-title', tr().toppingTitle));
  const row = el('div', 'pz-tray-row');
  const add = (t: Topping | null, emoji: string, label: string) => {
    const b = button(`pz-topping${t === selected ? ' is-on' : ''}`, emoji, () => onPick(t));
    b.setAttribute('aria-label', label);
    b.setAttribute('aria-pressed', String(t === selected));
    b.title = label;
    if (t) b.style.setProperty('--pz-sauce', TOPPING_ART[t].color);
    row.append(b);
  };
  for (const t of TOPPINGS) add(t, TOPPING_ART[t].emoji, tr().toppings[t]);
  add(null, '🧽', tr().eraser);
  box.append(row);
  return box;
}

/** Под пиццей: сколько кусков каждой начинки уже лежит, дробью из k; рядом — сокращённая, если отличается. */
export function countersView(order: Order, pizza: Pizza) {
  const row = el('div', 'pz-counters');
  const k = pizza.slices.length;
  if (k < 2) return row;
  const used = new Set<Topping>([...order.parts.map((p) => p.topping), ...pizza.slices.filter((s): s is Topping => !!s)]);
  for (const t of used) {
    const have = countOf(pizza, t);
    const chip = el('span', 'pz-counter');
    chip.append(el('span', '', TOPPING_ART[t].emoji), fracView({ n: have, d: k }));
    const short = simplify({ n: have, d: k });
    if (have > 0 && short.d !== k) chip.append(el('span', 'pz-eq', '='), fracView(short));
    row.append(chip);
  }
  return row;
}
