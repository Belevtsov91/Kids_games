// Сеанс дыхания: цикл кадров requestAnimationFrame гоняет автомат дыхания и перерисовывает сцену.
import { circleScale, PACES, startBreath, tick, type BreathEvent, type BreathState } from '../game/breath';
import type { Sound } from '../audio/Sound';
import { tr } from '../i18n';
import { SceneView } from '../ui/sceneView';
import type { Choice } from '../ui/screens';

export const GOAL = 5;

export class Session {
  private state: BreathState = startBreath(GOAL);
  private holding = false;
  private frame = 0;
  private last = 0;
  private paused = false;
  private readonly view: SceneView;

  constructor(stage: HTMLElement, private readonly c: Choice, private readonly sound: Sound, private readonly onDone: () => void) {
    this.view = new SceneView(c.scene, GOAL, c.color, c.mode === 'follow');
    const h = this.view.hold;
    h.addEventListener('pointerdown', this.down);
    window.addEventListener('pointerup', this.up);
    window.addEventListener('pointercancel', this.up);
    window.addEventListener('keydown', this.key);
    window.addEventListener('keyup', this.key);
    h.addEventListener('contextmenu', (e) => e.preventDefault());
    stage.append(this.view.node);
    sound.say(c.mode === 'follow' ? tr().sayFollow : tr().sayStart);
    this.frame = requestAnimationFrame(this.loop);
  }

  pause() {
    this.paused = true;
    this.holding = false;
  }

  resume() {
    this.paused = false;
    this.last = 0;
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('pointerup', this.up);
    window.removeEventListener('pointercancel', this.up);
    window.removeEventListener('keydown', this.key);
    window.removeEventListener('keyup', this.key);
  }

  private down = (e: PointerEvent) => {
    e.preventDefault();
    this.setHolding(true);
  };

  private up = () => this.setHolding(false);

  private key = (e: KeyboardEvent) => {
    if (e.code !== 'Space' && e.code !== 'Enter') return;
    e.preventDefault();
    this.setHolding(e.type === 'keydown');
  };

  private setHolding(on: boolean) {
    this.holding = on;
    this.view.setHolding(on);
  }

  private loop = (now: number) => {
    const dt = this.last ? Math.min(100, now - this.last) : 0;
    this.last = now;
    if (!this.paused) {
      const pace = this.c.slow ? PACES.slow : PACES.easy;
      const r = tick(this.state, dt, this.holding, this.c.mode, pace);
      this.state = r.state;
      r.events.forEach(this.react);
      this.draw();
    }
    if (this.state.phase !== 'done') this.frame = requestAnimationFrame(this.loop);
  };

  private react = (e: BreathEvent) => {
    if (e === 'inhale-start') this.sound.say(tr().sayInhale);
    else if (e === 'exhale-start') this.sound.say(tr().sayExhale);
    else if (e === 'too-short') this.sound.say(tr().sayShort);
    else if (e === 'breath-done') this.sound.correct();
    else if (e === 'all-done') this.onDone();
  };

  private draw() {
    const s = this.state;
    const text =
      s.phase === 'inhale' ? tr().inhale : s.phase === 'exhale' ? tr().exhale : s.phase === 'rest' ? tr().rest
        : this.c.mode === 'follow' ? tr().readyFollow : tr().ready;
    this.view.render(circleScale(s), text, s.breaths, s.phase === 'exhale' ? s.t : 0);
  }
}
