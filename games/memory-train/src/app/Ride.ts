// Одна поездка: показать поезд, спрятать в туннеле, задать вопрос и проверить ответ.
import { answerOf, orderStepOk, type Round } from '../game/train';
import type { Sound } from '../audio/Sound';
import { tr } from '../i18n';
import type { Confetti } from '../ui/Confetti';
import { button, el } from '../ui/dom';
import { TrainView } from '../ui/trainView';
import type { Timers } from './Timers';

export interface RideDeps {
  stage: HTMLElement;
  sound: Sound;
  confetti: Confetti;
  timers: Timers;
  onResult(ok: boolean): void;
}

export class Ride {
  private readonly view: TrainView;
  private readonly prompt = el('p', 'mt-prompt');
  private readonly options = el('div', 'mt-options');
  private step = 0;
  private finished = false;
  private missed = false;

  constructor(private readonly round: Round, private readonly d: RideDeps) {
    this.view = new TrainView(round.riders);
    d.stage.append(this.view.node, this.prompt, this.options);
    this.say(tr().watch);
    requestAnimationFrame(() => this.view.arrive());
    d.timers.later(() => {
      this.view.enterTunnel();
      this.say(tr().tunnel);
    }, round.showMs);
    d.timers.later(() => this.ask(), round.showMs + 1700);
  }

  private say(text: string) {
    this.prompt.textContent = text;
    this.d.sound.say(text);
  }

  private ask() {
    const q = this.round.question;
    this.view.leaveTunnel(q.kind !== 'missing', q.kind === 'missing' ? q.missing : undefined);
    if (q.kind === 'which') {
      this.view.point(q.wagon);
      this.say(tr().askWhich(q.wagon + 1));
    } else {
      this.say(q.kind === 'missing' ? tr().askMissing : tr().askOrder);
    }
    for (const a of this.round.options) {
      const b = button('mt-option', a, () => this.pick(a, b));
      this.options.append(b);
    }
  }

  private pick(a: string, b: HTMLButtonElement) {
    if (this.finished) return;
    if (this.round.question.kind === 'order') return this.pickOrder(a, b);
    const ok = a === answerOf(this.round);
    this.finish(ok, b);
  }

  private pickOrder(a: string, b: HTMLButtonElement) {
    if (!orderStepOk(this.round, this.step, a)) {
      this.d.sound.wrong();
      this.d.sound.say(tr().sayOrderWrong);
      this.d.timers.replayClass(b, 'is-shake');
      this.missed = true;
      return;
    }
    this.d.sound.correct();
    this.view.reveal(this.step);
    b.disabled = true;
    b.classList.add('is-used');
    this.step++;
    if (this.step >= this.round.riders.length) this.finish(!this.missed, b);
  }

  private finish(ok: boolean, b: HTMLElement) {
    this.finished = true;
    this.view.revealAll();
    this.view.point(null);
    b.classList.add(ok ? 'is-right' : 'is-wrong');
    if (ok) {
      this.d.sound.win();
      const r = b.getBoundingClientRect();
      const c = this.d.confetti.canvas.getBoundingClientRect();
      this.d.confetti.sparkle(r.left + r.width / 2 - c.left, r.top + r.height / 2 - c.top);
    } else {
      this.d.sound.wrong();
    }
    this.d.sound.say(ok ? tr().sayRight : tr().sayWrong);
    this.options.querySelectorAll('button').forEach((x) => (x.disabled = true));
    this.d.onResult(ok);
  }
}
