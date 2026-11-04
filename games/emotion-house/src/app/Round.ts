// Один раунд: узнать эмоцию по лицу и истории, затем выбрать, что поможет зверьку. Ошибок нет — только «подумай ещё».
import { ACTION_ART, COLOR, FACE, HELPERS, type Emotion } from '../game/emotions';
import { emotionChoices } from '../game/rounds';
import type { Scenario } from '../game/scenarios';
import type { Sound } from '../audio/Sound';
import { tr } from '../i18n';
import type { Confetti } from '../ui/Confetti';
import { RoundView } from '../ui/roundView';
import { choiceCard } from '../ui/screens';
import type { Timers } from './Timers';

export interface RoundDeps {
  stage: HTMLElement;
  sound: Sound;
  confetti: Confetti;
  timers: Timers;
  onCorrect(e: Emotion): void;
  onNext(): void;
  onHome(): void;
}

export class Round {
  private readonly view: RoundView;
  private solved = false;

  constructor(private readonly s: Scenario, open: readonly Emotion[], private readonly faces: boolean, private readonly d: RoundDeps) {
    this.view = new RoundView(s, faces ? FACE[s.emotion] : null, () => this.tell());
    const cards = emotionChoices(s.emotion, open, Math.random).map((e) =>
      choiceCard(FACE[e], tr().emotions[e], (card) => this.guess(e, card), COLOR[e]),
    );
    this.view.ask(tr().askEmotion, cards);
    d.stage.append(this.view.node);
    this.tell();
  }

  private tell() {
    this.d.sound.say(`${tr().scenarios[this.s.id]} ${this.solved ? tr().askHelp : tr().askEmotion}`);
  }

  private guess(e: Emotion, card: HTMLElement) {
    if (this.solved) return;
    if (e !== this.s.emotion) {
      this.d.sound.wrong();
      this.d.timers.replayClass(card, 'is-shake');
      return this.d.sound.say(this.faces ? tr().sayTry : tr().sayTryNoFace);
    }
    this.solved = true;
    this.d.sound.correct();
    this.view.setFace(FACE[e]);
    this.d.onCorrect(e);
    this.d.sound.say(`${tr().sayRight(tr().emotions[e])} ${tr().askHelp}`);
    const helpers = HELPERS[e].map((a) => choiceCard(ACTION_ART[a], tr().actions[a], (c) => this.help(c)));
    this.d.timers.later(() => this.view.ask(tr().askHelp, helpers), 700);
  }

  private help(card: HTMLElement) {
    this.d.sound.win();
    this.d.sound.say(tr().sayHelped);
    card.classList.add('is-picked');
    this.view.setFace(this.s.emotion === 'joy' || this.s.emotion === 'surprise' ? '🥰' : '😊');
    this.view.cheer();
    const r = card.getBoundingClientRect();
    const c = this.d.confetti.canvas.getBoundingClientRect();
    this.d.confetti.sparkle(r.left + r.width / 2 - c.left, r.top + r.height / 2 - c.top);
    this.view.choices.querySelectorAll('button').forEach((b) => (b.disabled = true));
    this.view.showNext(() => this.d.onNext(), () => this.d.onHome());
  }
}
