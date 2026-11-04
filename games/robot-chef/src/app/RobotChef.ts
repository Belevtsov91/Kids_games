import type { GameSdk } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import { LEVELS, levelAt } from '../game/levels';
import { readProgress, recordWin, starsFor, type Progress } from '../game/progress';
import { tr } from '../i18n';
import { Confetti } from '../ui/Confetti';
import { applyComfort, el } from '../ui/dom';
import { levelsScreen, startScreen, winOverlay } from '../ui/screens';
import { PlayRound } from './PlayRound';
import { Timers } from './Timers';

/** Вся игра: старт, карта уровней, уровень с программой робота, победа. Прогресс — в хранилище игры. */
export class RobotChef {
  private readonly root = el('div', 'rc');
  private readonly title = el('h1', 'rc-title');
  private readonly badge = el('div', 'rc-badge');
  private readonly stage = el('main', 'rc-stage');
  private readonly sound: Sound;
  private readonly confetti: Confetti;
  private readonly timers = new Timers();
  private readonly offMute: () => void;
  private readonly offEnding: () => void;
  private round: PlayRound | null = null;
  private progress: Progress;

  constructor(container: HTMLElement, private readonly sdk: GameSdk) {
    const top = el('header', 'rc-top');
    top.append(this.title, this.badge);
    this.root.append(top, this.stage);
    container.appendChild(this.root);
    this.confetti = new Confetti(this.root);
    this.sound = new Sound(sdk.audio.muted);
    this.offMute = sdk.audio.onMuteChange((m) => this.sound.setMuted(m));
    this.sound.setVolume(sdk.comfort.effectsVolume);
    applyComfort(this.root, 'rc', sdk.comfort);
    this.offEnding = sdk.time.onEnding(() => this.sound.say(tr().sayEnding));
    this.root.addEventListener('pointerdown', this.unlock, { capture: true });
    this.progress = readProgress(sdk.storage.load('progress'));
    this.showStart();
  }

  pause() {
    this.sound.pause();
  }

  resume() {
    this.sound.resume();
  }

  dispose() {
    this.reset('', '');
    this.offMute();
    this.offEnding();
    this.sound.dispose();
    this.confetti.dispose();
    this.root.remove();
  }

  private showStart() {
    this.reset(tr().title, '');
    this.stage.append(startScreen(this.sdk.profile?.name, () => this.showLevels()));
  }

  private showLevels() {
    this.reset(tr().levels, '');
    this.stage.append(levelsScreen(this.progress, (n) => this.play(n), () => this.showStart()));
  }

  private play(n: number) {
    const level = levelAt(n);
    this.reset(tr().title, tr().level(level.n));
    this.round = new PlayRound(level, {
      stage: this.stage,
      sound: this.sound,
      confetti: this.confetti,
      timers: this.timers,
      onWin: (attempts) => this.win(level.n, attempts),
    });
  }

  private win(n: number, attempts: number) {
    this.progress = recordWin(this.progress, n, attempts);
    this.sdk.storage.save('progress', this.progress);
    this.sdk.progress.level(n);
    this.sdk.progress.skill('logic', attempts <= 2);
    if (n === 1) this.sdk.progress.sticker('first-soup');
    if (LEVELS[n - 1]?.repeat && !LEVELS[n - 2]?.repeat) this.sdk.progress.sticker('loop-master');
    if (n >= LEVELS.length) this.sdk.progress.sticker('master-chef');
    this.sound.win();
    this.sound.say(tr().sayWin);
    this.timers.later(() => {
      this.confetti.burst();
      const last = n >= LEVELS.length;
      const win = winOverlay(starsFor(attempts), last, () => this.play(n + 1), () => this.play(n), () => this.showLevels());
      this.stage.append(win.overlay);
      win.focus();
    }, 700);
  }

  private reset(title: string, badge: string) {
    this.round?.dispose();
    this.round = null;
    this.timers.clear();
    this.confetti.clear();
    this.title.textContent = title;
    this.badge.textContent = badge;
    this.stage.replaceChildren();
  }

  private unlock = () => this.sound.unlock();
}
