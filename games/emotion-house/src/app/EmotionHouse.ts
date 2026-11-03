import type { GameSdk } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import { ROOM_FULL, litRooms, openEmotions, readProgress, recordCorrect, recordFeeling, showFaces, type Progress } from '../game/progress';
import { nextScenario } from '../game/rounds';
import type { Emotion } from '../game/emotions';
import { tr } from '../i18n';
import { Confetti } from '../ui/Confetti';
import { applyComfort, el } from '../ui/dom';
import { feelAnswer, feelScreen } from '../ui/feelView';
import { startScreen } from '../ui/screens';
import { Round } from './Round';
import { Timers } from './Timers';

const today = () => new Date().toISOString().slice(0, 10);

/** Вся игра: домик, раунды с ситуациями и «как я себя чувствую». Прогресс и дневник — в хранилище игры. */
export class EmotionHouse {
  private readonly root = el('div', 'eh');
  private readonly title = el('h1', 'eh-title');
  private readonly badge = el('div', 'eh-badge');
  private readonly stage = el('main', 'eh-stage');
  private readonly sound: Sound;
  private readonly confetti: Confetti;
  private readonly timers = new Timers();
  private readonly offMute: () => void;
  private readonly offEnding: () => void;
  private progress: Progress;
  private lastId: string | null = null;

  constructor(container: HTMLElement, private readonly sdk: GameSdk) {
    const top = el('header', 'eh-top');
    top.append(this.title, this.badge);
    this.root.append(top, this.stage);
    container.appendChild(this.root);
    this.confetti = new Confetti(this.root);
    this.sound = new Sound(sdk.audio.muted);
    this.offMute = sdk.audio.onMuteChange((m) => this.sound.setMuted(m));
    this.sound.setVolume(sdk.comfort.effectsVolume);
    applyComfort(this.root, 'eh', sdk.comfort);
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
    this.reset('');
    this.offMute();
    this.offEnding();
    this.sound.dispose();
    this.confetti.dispose();
    this.root.remove();
  }

  private showHome() {
    this.reset(tr().title);
    this.stage.append(startScreen(this.sdk.profile?.name, this.progress, () => this.play(), () => this.showFeel()));
  }

  private play() {
    this.reset(tr().title);
    const open = openEmotions(this.progress);
    const scenario = nextScenario(open, this.progress, this.lastId, Math.random);
    this.lastId = scenario.id;
    new Round(scenario, open, showFaces(this.progress), {
      stage: this.stage,
      sound: this.sound,
      confetti: this.confetti,
      timers: this.timers,
      onCorrect: (e) => this.correct(e),
      onNext: () => this.play(),
      onHome: () => this.showHome(),
    });
  }

  private correct(e: Emotion) {
    const before = this.progress.rooms[e] ?? 0;
    this.save(recordCorrect(this.progress, e));
    this.sdk.progress.level(e);
    if (before < ROOM_FULL && (this.progress.rooms[e] ?? 0) >= ROOM_FULL) {
      this.sdk.progress.sticker('first-room');
      if (litRooms(this.progress) >= 6) this.sdk.progress.sticker('all-rooms');
      this.timers.later(() => {
        this.confetti.burst();
        this.sound.say(tr().sayRoom(tr().emotions[e]));
      }, 2500);
    }
  }

  private showFeel() {
    this.reset(tr().feel);
    this.sound.say(tr().askFeel);
    this.stage.append(
      feelScreen((e) => {
        this.save(recordFeeling(this.progress, today(), e));
        this.sdk.progress.sticker('feelings');
        this.sound.say(tr().sayFeel[e]);
        this.stage.replaceChildren(feelAnswer(e, () => this.showHome()));
      }, () => this.showHome()),
    );
  }

  private save(p: Progress) {
    this.progress = p;
    this.sdk.storage.save('progress', p);
  }

  private reset(title: string) {
    this.timers.clear();
    this.confetti.clear();
    this.title.textContent = title;
    this.stage.replaceChildren();
  }

  private unlock = () => this.sound.unlock();
}
