import { ANIMAL_IDS, type Animal } from '../../game/animals';
import { RepeatGame } from '../../game/repeat';
import type { SongNote } from '../../game/song';
import { el } from '../../ui/dom';
import type { Mode, OrchestraContext } from '../context';
import { tr } from '../../i18n';

// «Повтори за мной»: оркестр играет фразу, ребёнок повторяет. Фраза растёт, за каждую — звезда.

type Phase = 'idle' | 'listen' | 'turn' | 'bravo';

const BUBBLES = (): Record<Phase, [string, string] | null> => ({
  idle: ['🐧', tr().idle],
  listen: ['👂', tr().listening],
  turn: ['👆', tr().yourTurn],
  bravo: null, // похвала каждый раз случайная
});

export class RepeatMode implements Mode {
  private game = new RepeatGame({ animals: ANIMAL_IDS });
  private phase: Phase = 'idle';

  constructor(private readonly ctx: OrchestraContext) {}

  get poolSize() {
    return this.game.poolSize;
  }

  enter() {
    const { ctx } = this;
    this.game = new RepeatGame({ animals: ANIMAL_IDS });
    ctx.audio.stopBeat();
    ctx.setSoundMode('instrument');
    const again = el('button', { className: 'ao-big ao-again', type: 'button', attrs: { 'aria-label': tr().again } }, '👂');
    again.addEventListener('click', () => {
      if (this.phase === 'idle') this.nextPhrase();
      else if (this.phase === 'turn') this.listenAgain();
    });
    ctx.panel.append(again, el('div', { className: 'ao-stars', attrs: { 'aria-label': tr().stars } }));
    this.updateStars();
    this.setPhase('idle');
  }

  leave() {}

  onAnimal(animal: Animal) {
    if (this.phase === 'idle') return this.nextPhrase();
    if (this.phase !== 'turn') return;
    this.ctx.hit(animal, 'instrument');
    const result = this.game.answer(animal.id);
    if (result === 'miss') this.onMiss(animal);
    else if (result === 'done') this.onPhraseDone();
    else this.updateDots();
  }

  /** Таймеры фразы сняты: начнём с новой фразы, когда ребёнок вернётся. */
  pause() {
    if (this.phase !== 'turn') this.setPhase('idle');
  }

  private nextPhrase() {
    this.game.newPhrase();
    this.ctx.stage.setResting(this.game.poolSize);
    this.playPhrase();
  }

  private listenAgain() {
    this.game.restartPhrase();
    this.playPhrase();
  }

  private playPhrase() {
    this.setPhase('listen');
    const notes: SongNote[] = this.game.phrase.map((a, i) => ({ a, t: 400 + i * 650, m: 'instrument' }));
    this.ctx.playback.play(notes, () => {
      if (this.phase === 'listen') this.setPhase('turn');
    });
  }

  private onMiss(animal: Animal) {
    const { ctx } = this;
    ctx.audio.oops();
    ctx.stage.shake(animal.id);
    ctx.stage.setBubble('🙈', tr().oops);
    this.phase = 'bravo';
    ctx.root.dataset.listening = 'true';
    ctx.playback.later(() => this.listenAgain(), 1300);
  }

  private onPhraseDone() {
    const { ctx } = this;
    this.setPhase('bravo');
    ctx.playback.later(() => {
      ctx.audio.praise();
      ctx.fx.confetti();
    }, 250);
    this.updateStars();
    ctx.playback.later(() => this.nextPhrase(), 2300);
  }

  private setPhase(phase: Phase) {
    this.phase = phase;
    this.ctx.root.dataset.listening = String(phase === 'listen' || phase === 'bravo');
    const praise = tr().praise;
    const [icon, text] = BUBBLES()[phase] ?? ['🎉', praise[Math.floor(Math.random() * praise.length)]];
    this.ctx.stage.setBubble(icon, text);
    this.updateDots();
    const again = this.ctx.panel.querySelector<HTMLButtonElement>('.ao-again');
    if (again) {
      again.disabled = phase === 'listen' || phase === 'bravo';
      again.textContent = phase === 'idle' ? '▶️' : '👂';
      again.setAttribute('aria-label', phase === 'idle' ? tr().start : tr().again);
    }
  }

  private updateStars() {
    const stars = this.ctx.panel.querySelector('.ao-stars');
    if (!stars) return;
    const n = this.game.stars;
    stars.replaceChildren(el('span', { className: 'ao-star', attrs: { 'aria-hidden': 'true' } }, '⭐'), el('span', { className: 'ao-star-count' }, String(n)));
    stars.setAttribute('aria-label', tr().starsN(n));
    if (n) stars.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 450 });
  }

  private updateDots() {
    this.ctx.stage.setDots(this.game.phrase.length, this.phase === 'turn' ? this.game.progress : 0);
  }
}
