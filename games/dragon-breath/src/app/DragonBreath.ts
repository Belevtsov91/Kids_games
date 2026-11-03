import type { GameSdk } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import { finishSession, readProgress, type Progress } from '../game/progress';
import { tr } from '../i18n';
import { Confetti } from '../ui/Confetti';
import { applyComfort, el } from '../ui/dom';
import { doneOverlay, startScreen, type Choice } from '../ui/screens';
import { Session } from './Session';
import { Timers } from './Timers';

/** Вся игра: настройки на старте, сеанс из пяти вдохов, спокойный дракончик в конце. */
export class DragonBreath {
  private readonly root = el('div', 'db');
  private readonly title = el('h1', 'db-title');
  private readonly stage = el('main', 'db-stage');
  private readonly sound: Sound;
  private readonly confetti: Confetti;
  private readonly timers = new Timers();
  private readonly offMute: () => void;
  private readonly offEnding: () => void;
  private session: Session | null = null;
  private progress: Progress;
  private choice: Choice;

  constructor(container: HTMLElement, private readonly sdk: GameSdk) {
    const top = el('header', 'db-top');
    top.append(this.title);
    this.root.append(top, this.stage);
    container.appendChild(this.root);
    this.confetti = new Confetti(this.root);
    this.sound = new Sound(sdk.audio.muted);
    this.offMute = sdk.audio.onMuteChange((m) => this.sound.setMuted(m));
    this.sound.setVolume(sdk.comfort.effectsVolume);
    applyComfort(this.root, 'db', sdk.comfort);
    this.offEnding = sdk.time.onEnding(() => this.sound.say(tr().sayEnding));
    this.root.addEventListener('pointerdown', this.unlock, { capture: true });
    this.progress = readProgress(sdk.storage.load('progress'));
    const saved = sdk.storage.load<Partial<Choice>>('choice');
    this.choice = { scene: 'balloon', mode: saved?.mode === 'follow' ? 'follow' : 'hold', slow: saved?.slow !== false, color: this.progress.color };
    this.showStart();
  }

  pause() {
    this.session?.pause();
    this.sound.pause();
  }

  resume() {
    this.session?.resume();
    this.sound.resume();
  }

  dispose() {
    this.reset('');
    this.offMute();
    this.offEnding();
    this.sound.dispose();
    this.confetti.dispose();
    this.root.remove();
  }

  private showStart() {
    this.reset(tr().title);
    this.stage.append(startScreen(this.sdk.profile?.name, this.progress, this.choice, (c) => this.start(c)));
  }

  private start(c: Choice) {
    this.choice = c;
    this.progress = { ...this.progress, color: c.color };
    this.sdk.storage.save('choice', { mode: c.mode, slow: c.slow });
    this.sdk.storage.save('progress', this.progress);
    this.reset(tr().scenes[c.scene]);
    this.session = new Session(this.stage, c, this.sound, () => this.done());
  }

  private done() {
    const r = finishSession(this.progress);
    this.progress = r.progress;
    this.sdk.storage.save('progress', this.progress);
    this.sdk.progress.level(this.choice.scene);
    this.sdk.progress.skill('routine', true);
    this.sdk.progress.sticker('first-calm');
    if (r.newColor) this.sdk.progress.sticker('new-color');
    if (this.progress.sessions >= 10) this.sdk.progress.sticker('calm-ten');
    this.sound.win();
    this.sound.say(tr().sayDone);
    this.confetti.burst(80);
    const o = doneOverlay(this.choice.color, r.newColor, () => this.start(this.choice), () => this.showStart());
    this.timers.later(() => {
      this.stage.append(o.overlay);
      o.focus();
    }, 600);
  }

  private reset(title: string) {
    this.session?.dispose();
    this.session = null;
    this.timers.clear();
    this.confetti.clear();
    this.title.textContent = title;
    this.stage.replaceChildren();
  }

  private unlock = () => this.sound.unlock();
}
