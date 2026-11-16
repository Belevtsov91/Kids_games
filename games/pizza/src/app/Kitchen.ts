// Один уровень: три гостя по очереди, для каждого — нарезать, разложить начинку и испечь.
import type { Sound } from '../audio/Sound';
import { check, hint, type Pizza, type Verdict } from '../game/check';
import { show, simplify, slicesFor } from '../game/fractions';
import { ORDERS_PER_LEVEL, type Level } from '../game/levels';
import { makeOrder, type Order } from '../game/orders';
import type { Topping } from '../game/toppings';
import { tr } from '../i18n';
import { OVEN, TYOPA } from '../ui/art';
import type { Confetti } from '../ui/Confetti';
import { button, el } from '../ui/dom';
import { countersView, knifeView, ticketView, trayView } from '../ui/panels';
import { PizzaView } from '../ui/pizzaView';
import type { Timers } from './Timers';

export interface KitchenDeps {
  stage: HTMLElement;
  sound: Sound;
  confetti: Confetti;
  timers: Timers;
  onAnswer: (ok: boolean) => void;
  onWin: (mistakes: number) => void;
}

export class Kitchen {
  private readonly root = el('section', 'pz-kitchen');
  private readonly bubble = el('p', 'pz-bubble');
  private readonly ticketSlot = el('div', 'pz-ticket-slot');
  private readonly board = el('div', 'pz-board');
  private readonly counters = el('div', 'pz-counters-slot');
  private readonly oven = el('div', 'pz-oven');
  private readonly knifeSlot = el('div', 'pz-knife-slot');
  private readonly traySlot = el('div', 'pz-tray-slot');
  private readonly bake: HTMLButtonElement;
  private readonly pizzaView: PizzaView;
  private order!: Order;
  private pizza: Pizza = { slices: [null] };
  private selected: Topping | null = null;
  private brush: Topping | null = null;
  private index = 0;
  private mistakes = 0;
  private busy = false;

  constructor(private readonly level: Level, private readonly deps: KitchenDeps) {
    const chef = el('div', 'pz-chef');
    chef.innerHTML = TYOPA;
    const talk = el('div', 'pz-talk');
    talk.append(chef, this.bubble);
    this.bubble.setAttribute('aria-live', 'polite');
    this.oven.innerHTML = OVEN;
    this.pizzaView = new PizzaView((i, start) => this.tapSlice(i, start), tr().title);
    this.board.append(this.pizzaView.el, this.oven);
    this.bake = button('pz-btn pz-btn-play', tr().bake, () => this.tryBake());
    const actions = el('div', 'pz-actions');
    actions.append(button('pz-btn pz-btn-soft pz-btn-small', tr().clear, () => this.clear()), button('pz-btn pz-btn-soft pz-btn-small', tr().hint, () => this.showHint()), this.bake);
    const left = el('div', 'pz-col pz-col-order');
    left.append(talk, this.ticketSlot);
    const mid = el('div', 'pz-col pz-col-pizza');
    mid.append(this.board, this.counters);
    const right = el('div', 'pz-col pz-col-tools');
    right.append(this.knifeSlot, this.traySlot, actions);
    this.root.append(left, mid, right);
    deps.stage.append(this.root);
    this.nextOrder(level.cut === 'free' && level.n === 6 ? tr().sayFreeCut : level.n === 1 ? tr().sayStart : null);
  }

  dispose() {
    this.pizzaView.dispose();
    this.root.remove();
  }

  private nextOrder(intro: string | null) {
    this.index += 1;
    this.order = makeOrder(this.level, Math.random, this.order);
    this.pizza = { slices: Array<Topping | null>(this.order.cut ?? 1).fill(null) };
    this.selected = this.order.parts[0].topping;
    this.ticketSlot.replaceChildren(ticketView(this.order, this.index, ORDERS_PER_LEVEL));
    this.root.classList.remove('is-served');
    this.busy = false;
    this.say(intro ?? tr().sayOrder(tr().guests[this.order.guest]));
    this.refresh();
  }

  private refresh() {
    this.pizzaView.render(this.pizza.slices);
    this.counters.replaceChildren(countersView(this.order, this.pizza));
    this.knifeSlot.replaceChildren(knifeView(this.order.cut, this.pizza.slices.length, (k) => this.cut(k)));
    this.traySlot.replaceChildren(trayView(this.selected, (t) => this.pick(t)));
  }

  private say(text: string) {
    this.bubble.textContent = text;
    this.deps.sound.say(text);
  }

  private pick(t: Topping | null) {
    this.selected = t;
    this.deps.sound.pick();
    this.refresh();
  }

  private cut(k: number) {
    if (this.busy) return;
    this.pizza = { slices: Array<Topping | null>(k).fill(null) };
    this.deps.sound.drop();
    this.refresh();
  }

  /** Первое касание решает, кладём или снимаем: по своей же начинке — снимаем, дальше палец делает то же. */
  private tapSlice(i: number, start: boolean) {
    if (this.busy) return;
    if (this.pizza.slices.length < 2) {
      this.say(tr().sayNeedCut);
      this.deps.timers.replayClass(this.knifeSlot, 'is-nudge');
      return;
    }
    if (start) this.brush = this.pizza.slices[i] === this.selected ? null : this.selected;
    if (this.pizza.slices[i] === this.brush) return;
    const slices = [...this.pizza.slices];
    slices[i] = this.brush;
    this.pizza = { slices };
    if (this.brush) this.deps.sound.pick();
    else this.deps.sound.drop();
    this.refresh();
  }

  private clear() {
    if (this.busy) return;
    this.pizza = { slices: Array<Topping | null>(this.pizza.slices.length).fill(null) };
    this.refresh();
  }

  private showHint() {
    if (this.busy) return;
    const h = hint(this.order, this.pizza);
    if (!h) this.say(tr().sayHintDone);
    else if (h.kind === 'cut') this.say(tr().sayHintCut(h.slices));
    else this.say(tr().sayHintPut(tr().toppings[h.topping], h.count, h.slices));
  }

  private tryBake() {
    if (this.busy) return;
    if (this.pizza.slices.length < 2) return this.say(tr().sayNeedCut);
    const verdict = check(this.order, this.pizza);
    this.deps.onAnswer(verdict.ok);
    if (!verdict.ok) {
      this.mistakes += 1;
      this.deps.sound.wrong();
      this.deps.timers.replayClass(this.board, 'is-shake');
      return this.say(explain(verdict));
    }
    this.busy = true;
    this.deps.sound.correct();
    this.root.classList.add('is-served');
    this.say(this.equalNote() ?? tr().sayGood);
    const box = this.board.getBoundingClientRect();
    const host = this.deps.confetti.canvas.getBoundingClientRect();
    this.deps.timers.later(() => this.deps.confetti.sparkle(box.left - host.left + box.width / 2, box.top - host.top + box.height / 2), 900);
    this.deps.timers.later(() => (this.index >= ORDERS_PER_LEVEL ? this.deps.onWin(this.mistakes) : this.nextOrder(null)), 2600);
  }

  /** «4/8 — это то же, что 1/2»: замечаем, когда доля собрана мелкими кусками. */
  private equalNote() {
    const k = this.pizza.slices.length;
    const part = this.order.parts.find((p) => !p.rest && simplify(p.share).d !== k);
    if (!part) return null;
    return tr().sayEqual(`${slicesFor(part.share, k)}/${k}`, show(simplify(part.share)));
  }
}

function explain(v: Exclude<Verdict, { ok: true }>) {
  if (v.kind === 'cut') return tr().sayCut(show(v.share), v.slices);
  if (v.kind === 'extra') return tr().sayExtra(tr().toppings[v.topping]);
  if (v.kind === 'amount') return tr().sayAmount(tr().toppings[v.topping], v.have, v.need, v.slices);
  return tr().sayPlain(v.have, v.need, v.slices);
}
