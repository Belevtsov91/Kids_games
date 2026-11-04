// Весы: на уровнях 1–2 — «что тяжелее», на 3–4 — уравновесить товар гирьками 1, 2, 5.
import { balanceItem, comparePair, tilt, WEIGHTS } from '../../game/scales';
import { tr } from '../../i18n';
import { button, el } from '../../ui/dom';
import { ScaleView } from '../../ui/scaleView';
import { sparkleAt, type StationDeps, type StationTask } from './types';

export function scalesTask(d: StationDeps): StationTask {
  return d.level <= 2 ? compareTask(d) : balanceTask(d);
}

function compareTask(d: StationDeps): StationTask {
  const [a, b] = comparePair(d.level, Math.random);
  const view = new ScaleView();
  view.left.append(el('span', 'ls-goods', a.art));
  view.right.append(el('span', 'ls-goods', b.art));
  view.setTilt(0);
  let done = false;
  const pick = (heavy: typeof a, other: typeof a, pan: HTMLElement) => {
    if (done) return;
    view.setTilt(tilt(a.weight, b.weight));
    if (heavy.weight > other.weight) {
      done = true;
      d.sound.correct();
      d.sound.say(tr().sayHeavier(tr().items[heavy.id]));
      sparkleAt(d.confetti, pan);
      d.onResult(true);
    } else {
      d.sound.wrong();
      d.sound.say(tr().sayLighter);
      d.onResult(false);
      d.timers.later(() => !done && view.setTilt(0), 1600);
    }
  };
  view.left.addEventListener('click', () => pick(a, b, view.left));
  view.right.addEventListener('click', () => pick(b, a, view.right));
  d.stage.append(el('p', 'ls-ask', tr().heavier), view.node);
  d.sound.say(tr().heavier);
  return { dispose() {} };
}

function balanceTask(d: StationDeps): StationTask {
  const item = balanceItem(d.level - 2, Math.random);
  const placed: number[] = [];
  const view = new ScaleView();
  view.left.append(el('span', 'ls-goods', item.art), el('small', 'ls-kg', tr().kg(item.weight)));
  view.left.disabled = true;
  const weights = el('div', 'ls-weights');
  let done = false;
  const redraw = () => {
    const right = placed.reduce((s, w) => s + w, 0);
    view.setTilt(tilt(item.weight, right));
    view.right.replaceChildren(...placed.map((w, i) => {
      const chip = button('ls-weight is-on', String(w), () => remove(i));
      chip.setAttribute('aria-label', tr().kg(w));
      return chip;
    }));
    if (done) return;
    if (right === item.weight) {
      done = true;
      d.sound.win();
      d.sound.say(tr().sayBalanced);
      sparkleAt(d.confetti, view.node);
      d.onResult(true);
    } else if (right > item.weight) {
      d.sound.wrong();
      d.sound.say(tr().sayTooHeavy);
      d.onResult(false);
    }
  };
  const remove = (i: number) => {
    if (done) return;
    placed.splice(i, 1);
    d.sound.drop();
    redraw();
  };
  for (const w of WEIGHTS) {
    if (d.level === 3 && w === 5) continue;
    const b = button('ls-weight', String(w), () => {
      if (done || placed.length >= 8) return;
      placed.push(w);
      d.sound.pick();
      redraw();
    });
    b.setAttribute('aria-label', tr().kg(w));
    weights.append(b);
  }
  redraw();
  d.stage.append(el('p', 'ls-ask', tr().balance), view.node, weights);
  d.sound.say(tr().balance);
  return { dispose() {} };
}
