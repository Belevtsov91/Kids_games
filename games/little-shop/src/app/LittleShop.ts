import type { GameSdk, Skill } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import { adapt } from '../game/adapt';
import { MAX_LEVEL, readProgress, STATIONS, type Progress, type Station } from '../game/progress';
import { tr } from '../i18n';
import { Confetti } from '../ui/Confetti';
import { applyComfort, button, el } from '../ui/dom';
import { cashTask } from './stations/cashTask';
import { juiceTask } from './stations/juiceTask';
import { scalesTask } from './stations/scalesTask';
import type { StationDeps, StationTask } from './stations/types';
import { Timers } from './Timers';

const TASKS: Record<Station, (d: StationDeps) => StationTask> = { scales: scalesTask, juice: juiceTask, cash: cashTask };
const SKILL: Record<Station, Skill> = { scales: 'sizes', juice: 'sizes', cash: 'count' };
const STICKER_AT = 5;

/** Вся игра: три прилавка, у каждого своя адаптивная сложность. */
export class LittleShop {
  private readonly root = el('div', 'ls');
  private readonly title = el('h1', 'ls-title');
  private readonly badge = el('div', 'ls-badge');
  private readonly stage = el('main', 'ls-stage');
  private readonly sound: Sound;
  private readonly confetti: Confetti;
  private readonly timers = new Timers();
  private readonly offMute: () => void;
  private readonly offEnding: () => void;
  private task: StationTask | null = null;
  private progress: Progress;

  constructor(container: HTMLElement, private readonly sdk: GameSdk) {
    const top = el('header', 'ls-top');
    top.append(this.title, this.badge);
    this.root.append(top, this.stage);
    container.appendChild(this.root);
    this.confetti = new Confetti(this.root);
    this.sound = new Sound(sdk.audio.muted);
    this.offMute = sdk.audio.onMuteChange((m) => this.sound.setMuted(m));
    this.sound.setVolume(sdk.comfort.effectsVolume);
    applyComfort(this.root, 'ls', sdk.comfort);
    this.offEnding = sdk.time.onEnding(() => this.sound.say(tr().sayEnding));
    this.root.addEventListener('pointerdown', this.unlock, { capture: true });
    this.progress = readProgress(sdk.storage.load('progress'));
    this.showShop();
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

  private showShop() {
    this.reset(tr().title, '');
    const screen = el('section', 'ls-shop');
    const awning = el('div', 'ls-awning');
    awning.setAttribute('aria-hidden', 'true');
    const counters = el('div', 'ls-stations');
    for (const s of STATIONS) {
      const b = button('ls-station', tr().stations[s], () => this.play(s));
      b.append(el('small', '', tr().level(this.progress.adapt[s].level)));
      counters.append(b);
    }
    screen.append(awning, el('p', 'ls-lead', tr().lead(this.sdk.profile?.name)), counters);
    this.stage.append(screen);
  }

  private play(s: Station) {
    const level = this.progress.adapt[s].level;
    this.reset(tr().stations[s], tr().level(level));
    const wrap = el('section', 'ls-task');
    wrap.append(button('ls-btn ls-btn-soft ls-btn-small ls-back', tr().back, () => this.showShop()));
    this.stage.append(wrap);
    // Ошибка засчитывается один раз за задание: перевесить несколько раз подряд — не повод понижать уровень.
    let missed = false;
    this.task = TASKS[s]({
      stage: wrap,
      sound: this.sound,
      confetti: this.confetti,
      timers: this.timers,
      level,
      onResult: (ok) => {
        if (!ok && missed) return;
        if (!ok) missed = true;
        this.result(s, ok);
      },
    });
  }

  private result(s: Station, ok: boolean) {
    const before = this.progress.adapt[s].level;
    const a = adapt(this.progress.adapt[s], ok, MAX_LEVEL[s]);
    this.progress = { adapt: { ...this.progress.adapt, [s]: a }, wins: { ...this.progress.wins, [s]: this.progress.wins[s] + (ok ? 1 : 0) } };
    this.sdk.storage.save('progress', this.progress);
    this.sdk.progress.skill(SKILL[s], ok);
    if (!ok) return;
    this.sdk.progress.level(`${s}-${before}`);
    if (this.progress.wins[s] >= STICKER_AT) this.sdk.progress.sticker(s === 'cash' ? 'cashier' : s);
    if (s === 'cash' && before >= 4) this.sdk.progress.sticker('change');
    const up = a.level > before;
    if (up) this.timers.later(() => this.sound.say(tr().sayLevelUp), 1200);
    this.timers.later(() => this.play(s), up ? 3000 : 1800);
  }

  private reset(title: string, badge: string) {
    this.task?.dispose();
    this.task = null;
    this.timers.clear();
    this.confetti.clear();
    this.title.textContent = title;
    this.badge.textContent = badge;
    this.stage.replaceChildren();
  }

  private unlock = () => this.sound.unlock();
}
