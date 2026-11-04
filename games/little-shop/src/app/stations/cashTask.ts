// Касса: положить монеты ровно на сумму покупки или дать сдачу. Монету в лотке можно убрать нажатием.
import { makeOrder, payState, sum, target } from '../../game/money';
import { tr } from '../../i18n';
import { button, el } from '../../ui/dom';
import { sparkleAt, type StationDeps, type StationTask } from './types';

export function cashTask(d: StationDeps): StationTask {
  const order = makeOrder(d.level, Math.random);
  const tray: number[] = [];
  let done = false;
  const ask = order.paid === null ? tr().payAsk(order.total) : tr().changeAsk(order.paid, order.total);
  const counter = el('div', 'ls-counter');
  for (const g of order.goods) {
    const item = el('div', 'ls-good');
    item.append(el('span', 'ls-goods', g.art), el('b', 'ls-price', `🪙${g.price}`));
    counter.append(item);
  }
  if (order.paid !== null) counter.append(el('div', 'ls-paid', `💵 ${order.paid}`));
  const trayNode = el('div', 'ls-tray');
  const total = el('div', 'ls-total');
  const redraw = () => {
    trayNode.replaceChildren(...tray.map((c, i) => button(`ls-coin ls-coin-${c}`, String(c), () => {
      if (done) return;
      tray.splice(i, 1);
      d.sound.drop();
      redraw();
    })));
    total.textContent = `${sum(tray)} / ${target(order)}`;
  };
  const check = () => {
    const state = payState(order, tray);
    if (state === 'exact') {
      done = true;
      d.sound.win();
      d.sound.say(tr().sayPaid);
      sparkleAt(d.confetti, trayNode);
      d.onResult(true);
    } else if (state === 'more') {
      d.sound.wrong();
      d.sound.say(tr().sayMore);
      d.onResult(false);
    }
  };
  const purse = el('div', 'ls-purse');
  for (const c of order.coins) {
    purse.append(button(`ls-coin ls-coin-${c}`, String(c), () => {
      if (done || tray.length >= 15) return;
      tray.push(c);
      d.sound.pick();
      redraw();
      check();
    }));
  }
  redraw();
  d.stage.append(el('p', 'ls-ask', ask), counter, total, trayNode, purse);
  d.sound.say(ask);
  return { dispose() {} };
}
