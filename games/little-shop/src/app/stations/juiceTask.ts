// Сок до отметки: пока кнопку держат, уровень растёт; отпустили — проверяем, насколько близко к линии.
import { judge, juiceTarget, pour } from '../../game/juice';
import { tr } from '../../i18n';
import { button, el } from '../../ui/dom';
import { sparkleAt, type StationDeps, type StationTask } from './types';

export function juiceTask(d: StationDeps): StationTask {
  const target = juiceTarget(d.level, Math.random);
  let amount = 0;
  let holding = false;
  let finished = false;
  let frame = 0;
  let last = 0;
  const glass = el('div', 'ls-glass');
  const juice = el('div', 'ls-juice');
  const line = el('div', 'ls-line');
  line.style.bottom = `${target * 100}%`;
  glass.append(juice, line);
  const hold = el('button', 'ls-btn ls-btn-play ls-hold', `🧃 ${tr().pourHold}`);
  const again = button('ls-btn ls-btn-soft', tr().again, () => reset());
  again.hidden = true;
  const draw = () => juice.style.setProperty('--ls-amount', String(amount));
  const loop = (now: number) => {
    const dt = last ? Math.min(100, now - last) : 0;
    last = now;
    if (holding) {
      amount = pour(amount, dt);
      draw();
      if (amount >= 1) stop();
    }
    frame = requestAnimationFrame(loop);
  };
  const start = (e: Event) => {
    e.preventDefault();
    if (finished) return;
    holding = true;
    hold.classList.add('is-down');
    d.sound.pick();
  };
  const stop = () => {
    if (!holding) return;
    holding = false;
    hold.classList.remove('is-down');
    finished = true;
    const result = judge(d.level, target, amount);
    if (result === 'ok') {
      d.sound.win();
      d.sound.say(tr().sayJuiceOk);
      sparkleAt(d.confetti, line);
      d.onResult(true);
    } else {
      d.sound.wrong();
      d.sound.say(result === 'less' ? tr().sayJuiceLess : tr().sayJuiceMore);
      d.onResult(false);
      again.hidden = false;
    }
  };
  const reset = () => {
    amount = 0;
    finished = false;
    again.hidden = true;
    draw();
  };
  hold.addEventListener('pointerdown', start);
  hold.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('pointerup', stop);
  window.addEventListener('pointercancel', stop);
  draw();
  const actions = el('div', 'ls-actions');
  actions.append(hold, again);
  d.stage.append(el('p', 'ls-ask', tr().pourAsk), glass, actions);
  d.sound.say(tr().pourAsk);
  frame = requestAnimationFrame(loop);
  return {
    dispose() {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    },
  };
}
