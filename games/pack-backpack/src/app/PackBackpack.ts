import type { GameSdk } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import { readProgress, recordTrip, type Progress } from '../game/progress';
import { buildShelf, extrasFor, isReady, pack, type Trip } from '../game/trips';
import { tr } from '../i18n';
import { Confetti } from '../ui/Confetti';
import { applyComfort, el } from '../ui/dom';
import { doneOverlay, PackView, tripsScreen } from '../ui/screens';
import { Timers } from './Timers';

const STICKER: Record<string, string> = { rain: 'rain-ready', snow: 'snow-ready', hike: 'traveller' };

/** Вся игра: выбор поездки, сборка рюкзака касанием вещей, прогулка в конце. */
export class PackBackpack {
  private readonly root = el('div', 'pb');
  private readonly title = el('h1', 'pb-title');
  private readonly badge = el('div', 'pb-badge');
  private readonly stage = el('main', 'pb-stage');
  private readonly sound: Sound;
  private readonly confetti: Confetti;
  private readonly timers = new Timers();
  private readonly offMute: () => void;
  private readonly offEnding: () => void;
  private progress: Progress;

  constructor(container: HTMLElement, private readonly sdk: GameSdk) {
    const top = el('header', 'pb-top');
    top.append(this.title, this.badge);
    this.root.append(top, this.stage);
    container.appendChild(this.root);
    this.confetti = new Confetti(this.root);
    this.sound = new Sound(sdk.audio.muted);
    this.offMute = sdk.audio.onMuteChange((m) => this.sound.setMuted(m));
    this.sound.setVolume(sdk.comfort.effectsVolume);
    applyComfort(this.root, 'pb', sdk.comfort);
    this.offEnding = sdk.time.onEnding(() => this.sound.say(tr().sayEnding));
    this.root.addEventListener('pointerdown', this.unlock, { capture: true });
    this.progress = readProgress(sdk.storage.load('progress'));
    this.showTrips();
  }

  pause() {
    this.sound.pause();
  }

  resume() {
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

  private showTrips() {
    this.reset(tr().title);
    this.sound.say(tr().lead(this.sdk.profile?.name));
    this.stage.append(tripsScreen(this.sdk.profile?.name, this.progress, (t) => this.play(t)));
  }

  private play(trip: Trip) {
    this.reset(tr().title);
    const packed = new Set<string>();
    let missed = false;
    const items = buildShelf(trip, extrasFor(this.progress.done[trip.id] ?? 0), Math.random);
    const view = new PackView(trip, items, (id, btn) => {
      const result = pack(trip, packed, id);
      if (result === 'already') return;
      if (result === 'wrong') {
        this.sound.wrong();
        this.sound.say(tr().sayWrong(tr().items[id]));
        this.timers.replayClass(btn, 'is-shake');
        this.sdk.progress.skill('logic', false);
        missed = true;
        return;
      }
      packed.add(id);
      view.putIn(id, btn);
      view.setCount(packed.size, trip.need.length);
      this.sound.correct();
      this.sound.say(tr().sayPacked(tr().items[id]));
      if (isReady(trip, packed)) this.timers.later(() => this.done(trip, missed), 700);
    }, () => this.showTrips());
    view.setCount(0, trip.need.length);
    this.stage.append(view.node);
    this.sound.say(tr().sayTrip(tr().trips[trip.id]));
  }

  private done(trip: Trip, missed: boolean) {
    this.progress = recordTrip(this.progress, trip.id);
    this.sdk.storage.save('progress', this.progress);
    this.sdk.progress.level(trip.id);
    this.sdk.progress.skill('routine', true);
    this.sdk.progress.skill('logic', !missed);
    this.sdk.progress.sticker('first-trip');
    if (STICKER[trip.id]) this.sdk.progress.sticker(STICKER[trip.id]);
    this.sound.win();
    this.sound.say(tr().sayReady);
    this.confetti.burst();
    const o = doneOverlay(trip, () => {
      o.overlay.classList.add('is-going');
      this.timers.later(() => this.showTrips(), 1600);
    }, () => this.showTrips());
    this.stage.append(o.overlay);
    o.focus();
  }

  private reset(title: string) {
    this.timers.clear();
    this.confetti.clear();
    this.title.textContent = title;
    this.stage.replaceChildren();
  }

  private unlock = () => this.sound.unlock();
}
