import type { GameSdk } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import { adapt } from '../game/adapt';
import { readProgress, recordRide, type Progress } from '../game/progress';
import { makeRound, MAX_LEVEL, wagonsFor } from '../game/train';
import { tr } from '../i18n';
import { Confetti } from '../ui/Confetti';
import { applyComfort, button, el } from '../ui/dom';
import { Ride } from './Ride';
import { Timers } from './Timers';

/** Вся игра: вокзал (старт) и поездки одна за другой; длина поезда подстраивается под ребёнка. */
export class MemoryTrain {
  private readonly root = el('div', 'mt');
  private readonly title = el('h1', 'mt-title');
  private readonly badge = el('div', 'mt-badge');
  private readonly stage = el('main', 'mt-stage');
  private readonly sound: Sound;
  private readonly confetti: Confetti;
  private readonly timers = new Timers();
  private readonly offMute: () => void;
  private readonly offEnding: () => void;
  private progress: Progress;

  constructor(container: HTMLElement, private readonly sdk: GameSdk) {
    const top = el('header', 'mt-top');
    top.append(this.title, this.badge);
    this.root.append(top, this.stage);
    container.appendChild(this.root);
    this.confetti = new Confetti(this.root);
    this.sound = new Sound(sdk.audio.muted);
    this.offMute = sdk.audio.onMuteChange((m) => this.sound.setMuted(m));
    this.sound.setVolume(sdk.comfort.effectsVolume);
    applyComfort(this.root, 'mt', sdk.comfort);
    this.offEnding = sdk.time.onEnding(() => this.sound.say(tr().sayEnding));
    this.root.addEventListener('pointerdown', this.unlock, { capture: true });
    this.progress = readProgress(sdk.storage.load('progress'));
    this.showStation();
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

  private showStation() {
    this.reset(tr().title, '');
    const screen = el('section', 'mt-start');
    screen.append(el('div', 'mt-hero', '🚂🚃🚃'), el('p', 'mt-lead', tr().lead(this.sdk.profile?.name)), button('mt-btn mt-btn-play', tr().play, () => this.ride()));
    if (this.progress.best) screen.append(el('p', 'mt-best', tr().best(this.progress.best)));
    this.stage.append(screen);
  }

  private ride() {
    const level = this.progress.adapt.level;
    this.reset(tr().title, tr().level(wagonsFor(level)));
    const wrap = el('section', 'mt-ride');
    this.stage.append(wrap);
    new Ride(makeRound(level, Math.random), {
      stage: wrap,
      sound: this.sound,
      confetti: this.confetti,
      timers: this.timers,
      onResult: (ok) => this.result(ok, level, wrap),
    });
  }

  private result(ok: boolean, level: number, wrap: HTMLElement) {
    const a = adapt(this.progress.adapt, ok, MAX_LEVEL);
    this.progress = recordRide(this.progress, ok, a, level);
    this.sdk.storage.save('progress', this.progress);
    this.sdk.progress.skill('memory', ok);
    if (ok) {
      this.sdk.progress.level(wagonsFor(level));
      this.sdk.progress.sticker('first-ride');
      if (wagonsFor(level) >= 4) this.sdk.progress.sticker('long-train');
      if (wagonsFor(level) >= 6) this.sdk.progress.sticker('conductor');
    }
    if (a.level > level) this.timers.later(() => this.sound.say(tr().sayLevelUp), 1400);
    const actions = el('div', 'mt-actions');
    const next = button('mt-btn mt-btn-play', tr().next, () => this.ride());
    actions.append(next, button('mt-btn mt-btn-soft', tr().home, () => this.showStation()));
    wrap.append(actions);
    next.focus({ preventScroll: true });
  }

  private reset(title: string, badge: string) {
    this.timers.clear();
    this.confetti.clear();
    this.title.textContent = title;
    this.badge.textContent = badge;
    this.stage.replaceChildren();
  }

  private unlock = () => this.sound.unlock();
}
