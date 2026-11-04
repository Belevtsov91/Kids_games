// Одна загадка: вопрос голосом, картинка и варианты. Первый ответ засчитывается, верный подсвечивается.
import type { Sound } from '../audio/Sound';
import type { Season } from '../game/seasons';
import { answerOk, type Question } from '../game/things';
import { tr } from '../i18n';
import type { Confetti } from '../ui/Confetti';
import { button, el } from '../ui/dom';

export const SEASON_EMOJI: Record<Season, string> = { spring: '🌸', summer: '☀️', autumn: '🍁', winter: '❄️' };

export interface QuizDeps {
  stage: HTMLElement;
  sound: Sound;
  confetti: Confetti;
  onResult: (ok: boolean) => void;
}

function textOf(q: Question) {
  const t = tr();
  if (q.kind === 'fits') return t.askFits(t.when[q.season]);
  if (q.kind === 'odd') return t.askOdd(t.when[q.season]);
  if (q.kind === 'which') return t.askWhich;
  return t.askNext(t.after[q.season]);
}

export class Quiz {
  private done = false;
  private readonly buttons: { id: string; btn: HTMLButtonElement }[] = [];

  constructor(private readonly q: Question, private readonly d: QuizDeps) {
    const text = textOf(q);
    const wrap = el('div', 'sg-quiz');
    const picture = el('div', `sg-quiz-picture sg-season-${q.kind === 'which' ? 'none' : q.season}`);
    picture.textContent = q.kind === 'which' ? q.thing.emoji : SEASON_EMOJI[q.season];
    const options = el('div', 'sg-options');
    const add = (id: string, emoji: string, label = '') => {
      const btn = button('sg-option', '', () => this.pick(id));
      btn.append(el('span', 'sg-option-emoji', emoji));
      if (label) btn.append(el('span', 'sg-option-label', label));
      this.buttons.push({ id, btn });
      options.append(btn);
    };
    if (q.kind === 'fits' || q.kind === 'odd') q.options.forEach((t) => add(t.id, t.emoji));
    else (q.options as Season[]).forEach((s) => add(s, SEASON_EMOJI[s], tr().seasons[s]));
    wrap.append(picture, el('h2', 'sg-question', text), options);
    d.stage.append(wrap);
    d.sound.say(text);
  }

  private pick(id: string) {
    if (this.done) return;
    this.done = true;
    const ok = answerOk(this.q, id);
    for (const { id: bid, btn } of this.buttons) {
      btn.disabled = true;
      if (bid === this.q.answer) btn.classList.add('is-right');
      else if (bid === id) btn.classList.add('is-wrong');
    }
    if (ok) {
      this.d.sound.correct();
      this.d.confetti.burst(60);
    } else this.d.sound.wrong();
    this.d.sound.say(ok ? tr().sayRight : tr().sayWrong);
    this.d.onResult(ok);
  }
}
