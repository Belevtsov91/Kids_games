import type { GameSdk } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import { adapt } from '../game/adapt';
import { allSeen, readProgress, recordAnswer, seeSeason, type Progress } from '../game/progress';
import { SEASONS, type Season } from '../game/seasons';
import { makeQuestion, MAX_LEVEL } from '../game/things';
import { tr } from '../i18n';
import { Confetti } from '../ui/Confetti';
import { applyComfort, button, el } from '../ui/dom';
import { Garden } from './Garden';
import { Quiz } from './Quiz';
import { Timers } from './Timers';

/** Сезон по календарю: с него открывается сад (северное полушарие). */
const seasonNow = (): Season => SEASONS[Math.floor(((new Date().getMonth() + 10) % 12) / 3)]!;

/** Вся игра: старт, свободный сад и загадки с адаптивной сложностью. */
export class SeasonsGarden {
  private readonly root = el('div', 'sg');
  private readonly title = el('h1', 'sg-title');
  private readonly badge = el('div', 'sg-badge');
  private readonly stage = el('main', 'sg-stage');
  private readonly sound: Sound;
  private readonly confetti: Confetti;
  private readonly timers = new Timers();
  private readonly offMute: () => void;
  private readonly offEnding: () => void;
  private progress: Progress;

  constructor(container: HTMLElement, private readonly sdk: GameSdk) {
    const top = el('header', 'sg-top');
    top.append(this.title, this.badge);
    this.root.append(top, this.stage);
    container.appendChild(this.root);
    this.confetti = new Confetti(this.root);
    this.sound = new Sound(sdk.audio.muted);
    this.offMute = sdk.audio.onMuteChange((m) => this.sound.setMuted(m));
    this.sound.setVolume(sdk.comfort.effectsVolume);
    applyComfort(this.root, 'sg', sdk.comfort);
    this.offEnding = sdk.time.onEnding(() => this.sound.say(tr().sayEnding));
    this.root.addEventListener('pointerdown', this.unlock, { capture: true });
    this.progress = readProgress(sdk.storage.load('progress'));
    this.showHome();
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

  private showHome() {
    this.reset(tr().title, '');
    const screen = el('section', 'sg-start');
    const actions = el('div', 'sg-actions');
    actions.append(button('sg-btn sg-btn-play', tr().garden, () => this.showGarden()), button('sg-btn sg-btn-play', tr().quiz, () => this.ask()));
    screen.append(el('div', 'sg-hero', '🌸☀️🍁❄️'), el('p', 'sg-lead', tr().lead(this.sdk.profile?.name)), actions);
    this.stage.append(screen);
  }

  private showGarden() {
    this.reset(tr().title, '');
    new Garden({ stage: this.stage, sound: this.sound, onSeason: (s) => this.saw(s) }, seasonNow());
    this.stage.querySelector('.sg-explore')?.append(this.homeButton());
  }

  private saw(s: Season) {
    if (this.progress.seen.includes(s)) return;
    this.progress = seeSeason(this.progress, s);
    this.save();
    this.sdk.progress.skill('nature', true);
    if (allSeen(this.progress)) this.sdk.progress.sticker('four-seasons');
  }

  private ask() {
    const level = this.progress.adapt.level;
    this.reset(tr().title, tr().level(level));
    const wrap = el('section', 'sg-ask');
    this.stage.append(wrap);
    new Quiz(makeQuestion(level, Math.random), {
      stage: wrap,
      sound: this.sound,
      confetti: this.confetti,
      onResult: (ok) => this.result(ok, level, wrap),
    });
  }

  private result(ok: boolean, level: number, wrap: HTMLElement) {
    const a = adapt(this.progress.adapt, ok, MAX_LEVEL);
    this.progress = recordAnswer(this.progress, ok, a);
    this.save();
    this.sdk.progress.skill(level >= 4 ? 'logic' : 'nature', ok);
    if (ok) {
      this.sdk.progress.level(level);
      this.sdk.progress.sticker('gardener');
      if (level >= MAX_LEVEL) this.sdk.progress.sticker('nature-expert');
    }
    if (a.level > level) this.timers.later(() => this.sound.say(tr().sayLevelUp), 1400);
    const actions = el('div', 'sg-actions');
    const next = button('sg-btn sg-btn-play', tr().next, () => this.ask());
    actions.append(next, this.homeButton());
    wrap.append(actions);
    next.focus({ preventScroll: true });
  }

  private homeButton() {
    return button('sg-btn sg-btn-soft sg-btn-small', tr().home, () => this.showHome());
  }

  private save() {
    this.sdk.storage.save('progress', this.progress);
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
