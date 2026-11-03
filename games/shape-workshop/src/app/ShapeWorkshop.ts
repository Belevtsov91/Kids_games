import type { GameSdk } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import { PICTURES, type Picture } from '../game/pictures';
import { markDone, readProgress, type Progress } from '../game/progress';
import { tr } from '../i18n';
import { Confetti } from '../ui/Confetti';
import { applyComfort, el } from '../ui/dom';
import { picturesScreen, startScreen, winOverlay } from '../ui/screens';
import { BuildRound } from './BuildRound';
import { FreeBuild } from './FreeBuild';
import { Timers } from './Timers';

/** Вся игра: старт, выбор картинки, сборка по силуэту и свободная мастерская. */
export class ShapeWorkshop {
  private readonly root = el('div', 'sw');
  private readonly title = el('h1', 'sw-title');
  private readonly badge = el('div', 'sw-badge');
  private readonly stage = el('main', 'sw-stage');
  private readonly sound: Sound;
  private readonly confetti: Confetti;
  private readonly timers = new Timers();
  private readonly offMute: () => void;
  private readonly offEnding: () => void;
  private round: BuildRound | null = null;
  private progress: Progress;

  constructor(container: HTMLElement, private readonly sdk: GameSdk) {
    const top = el('header', 'sw-top');
    top.append(this.title, this.badge);
    this.root.append(top, this.stage);
    container.appendChild(this.root);
    this.confetti = new Confetti(this.root);
    this.sound = new Sound(sdk.audio.muted);
    this.offMute = sdk.audio.onMuteChange((m) => this.sound.setMuted(m));
    this.sound.setVolume(sdk.comfort.effectsVolume);
    applyComfort(this.root, 'sw', sdk.comfort);
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
    this.stage.append(startScreen(this.sdk.profile?.name, () => this.showPictures(), () => this.showFree()));
  }

  private showPictures() {
    this.reset(tr().pictures, `${this.progress.done.length}/${PICTURES.length}`);
    this.stage.append(picturesScreen(this.progress, (pic) => this.build(pic), () => this.showStart()));
  }

  private build(pic: Picture) {
    this.reset(tr().names[pic.id], '');
    this.round = new BuildRound(pic, {
      stage: this.stage,
      sound: this.sound,
      confetti: this.confetti,
      timers: this.timers,
      onShape: (ok) => this.sdk.progress.skill('shapes', ok),
      onDone: () => this.done(pic),
    });
  }

  private done(pic: Picture) {
    this.save(markDone(this.progress, pic.id));
    this.sdk.progress.level(pic.id);
    this.sdk.progress.sticker('first-picture');
    if (pic.id === 'rocket') this.sdk.progress.sticker('rocket');
    if (this.progress.done.length >= PICTURES.length) this.sdk.progress.sticker('all-pictures');
    this.sound.win();
    this.sound.say(tr().sayDone(tr().names[pic.id]));
    this.confetti.burst();
    const i = PICTURES.indexOf(pic);
    const next = PICTURES[i + 1];
    const win = winOverlay(pic, Boolean(next), () => next && this.build(next), () => this.showPictures());
    this.stage.append(win.overlay);
    win.focus();
  }

  private showFree() {
    this.reset(tr().free, '');
    new FreeBuild(this.stage, this.progress.free, this.sound, (pieces) => {
      this.save({ ...this.progress, free: pieces });
      if (pieces.length >= 3) this.sdk.progress.sticker('free-build');
    });
    this.sdk.progress.skill('creativity', true);
  }

  private save(p: Progress) {
    this.progress = p;
    this.sdk.storage.save('progress', p);
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
