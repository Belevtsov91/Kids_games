// Вся игра: карта рейсов → рейс → итог. Прогресс и прицел сохраняются между запусками.
import type { GameSdk } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import { LEVELS } from '../game/levels';
import { allDone, readProgress, recordWin, starsFor, type Progress } from '../game/progress';
import { tr } from '../i18n';
import type { Aim } from '../ui/controls';
import { applyComfort, button, el } from '../ui/dom';
import { failOverlay, finaleOverlay, levelMap, winOverlay } from '../ui/screens';
import { Mission, type MissionEnd } from './Mission';

const START_AIM: Aim = { angle: 30, power: 50 };

export class StarNavigator {
  private readonly root = el('div', 'sn');
  private readonly title = el('h1', 'sn-title');
  private readonly back: HTMLButtonElement;
  private readonly stage = el('main', 'sn-stage');
  private readonly sound: Sound;
  private readonly offMute: () => void;
  private readonly offEnding: () => void;
  private mission: Mission | null = null;
  private overlay: HTMLElement | null = null;
  private timer = 0;
  private progress: Progress;
  private index = 0;
  private aim: Aim = START_AIM;

  constructor(container: HTMLElement, private readonly sdk: GameSdk) {
    const top = el('header', 'sn-top');
    this.back = button('sn-btn sn-back', tr().levelsBtn, () => this.showMap());
    top.append(this.title, this.back);
    this.root.append(top, this.stage);
    container.appendChild(this.root);
    this.sound = new Sound(sdk.audio.muted);
    this.sound.setVolume(sdk.comfort.effectsVolume);
    this.offMute = sdk.audio.onMuteChange((m) => this.sound.setMuted(m));
    this.offEnding = sdk.time.onEnding(() => this.sound.say(tr().sayEnding));
    applyComfort(this.root, 'sn', sdk.comfort);
    this.root.addEventListener('pointerdown', this.unlock, { capture: true });
    this.progress = readProgress(sdk.storage.load('progress'));
    this.showMap();
  }

  pause() {
    this.mission?.pause();
    this.sound.pause();
  }

  resume() {
    this.mission?.resume();
    this.sound.resume();
  }

  dispose() {
    this.clear();
    this.offMute();
    this.offEnding();
    this.sound.dispose();
    this.root.removeEventListener('pointerdown', this.unlock, { capture: true });
    this.root.remove();
  }

  private unlock = () => this.sound.unlock();

  private clear() {
    window.clearTimeout(this.timer);
    if (this.mission) this.aim = this.mission.currentAim;
    this.mission?.dispose();
    this.mission = null;
    this.overlay?.remove();
    this.overlay = null;
    this.stage.replaceChildren();
  }

  private showMap() {
    this.clear();
    this.title.textContent = tr().title;
    this.back.hidden = true;
    this.stage.append(levelMap(this.sdk.profile?.name, this.progress, (i) => this.play(i)));
  }

  private play(index: number) {
    this.clear();
    this.index = index;
    const level = LEVELS[index];
    this.title.textContent = `${index + 1}. ${tr().levels[level.id]}`;
    this.back.hidden = false;
    this.mission = new Mission(level, this.aim, this.sound, this.sdk.comfort, (end) => this.ended(end));
    this.stage.append(this.mission.root);
    if (index === 0 && !(level.id in this.progress.stars)) this.sound.say(tr().sayStart);
  }

  private ended(end: MissionEnd) {
    const level = LEVELS[this.index];
    if (end.status !== 'won') {
      this.sound.fail();
      this.sound.say(tr().sayCrash);
      this.later(() => this.show(failOverlay(end.status, () => this.retry())), 700);
      return;
    }
    const total = level.crystals.length;
    const stars = starsFor(end.got, total, end.attempts);
    this.progress = recordWin(this.progress, level.id, stars).progress;
    this.sdk.storage.save('progress', this.progress);
    this.reportWin(level.id, level.goal === 'orbit', end.got >= total && total > 0);
    this.sound.win();
    this.sound.say(level.goal === 'orbit' ? tr().sayOrbit : tr().sayWin);
    const last = this.index === LEVELS.length - 1;
    const info = { orbit: level.goal === 'orbit', got: end.got, total, attempts: end.attempts, stars, last };
    this.later(() => {
      if (last && allDone(this.progress)) this.show(finaleOverlay(() => this.showMap()));
      else this.show(winOverlay(info, () => this.play(this.index + 1), () => this.play(this.index), () => this.showMap()));
    }, 900);
  }

  private reportWin(id: string, orbit: boolean, crystals: boolean) {
    const p = this.sdk.progress;
    p.level(id);
    p.skill('space', true);
    p.skill('logic', true);
    p.sticker('first-flight');
    if (orbit) p.sticker('first-orbit');
    if (id === 'slingshot') p.sticker('slingshot');
    if (crystals) p.sticker('all-crystals');
    if (allDone(this.progress)) p.sticker('navigator');
  }

  private retry() {
    this.overlay?.remove();
    this.overlay = null;
    this.mission?.reset();
  }

  private show(o: { overlay: HTMLElement; focus: () => void }) {
    this.overlay?.remove();
    this.overlay = o.overlay;
    this.stage.append(o.overlay);
    o.focus();
  }

  private later(fn: () => void, ms: number) {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(fn, ms);
  }
}
