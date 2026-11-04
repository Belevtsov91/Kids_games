import type { GameSdk } from '@ig/sdk';
import { ProgressSync } from '../api/progress';
import { Sound } from '../audio/Sound';
import { allAnimals } from '../game/data';
import { buildRound } from '../game/rounds';
import { Confetti } from '../ui/Confetti';
import { el } from '../ui/dom';
import { albumScreen, startScreen, winOverlay } from '../ui/screens';
import { rewardRound } from './rewards';
import { RoundPlay } from './RoundPlay';
import { Timers } from './Timers';
import { animalName, homeWhere, tr } from '../i18n';

/** Вся игра: стартовый экран, раунд с перетаскиванием, альбом найденных зверей. */
export class WhoLivesWhere {
  private readonly root = el('div', 'wlw');
  private readonly title = el('h1', 'wlw-title');
  private readonly badge = el('div', 'wlw-badge');
  private readonly stage = el('main', 'wlw-stage');
  private readonly confetti: Confetti;
  private readonly sound: Sound;
  private readonly progress: ProgressSync;
  private readonly timers = new Timers();
  private readonly offMute: () => void;
  private round: RoundPlay | null = null;
  private disposed = false;
  /** Номер экрана: если ребёнок успел нажать что-то ещё, пока грузился прогресс, старый экран не показываем. */
  private screen = 0;

  constructor(
    container: HTMLElement,
    private readonly sdk: GameSdk,
  ) {
    const top = el('header', 'wlw-top');
    top.append(this.title, this.badge);
    this.root.append(top, this.stage);
    container.appendChild(this.root);
    this.confetti = new Confetti(this.root);
    this.sound = new Sound(sdk.audio.muted);
    this.progress = new ProgressSync(sdk.api);
    this.offMute = sdk.audio.onMuteChange((muted) => this.sound.setMuted(muted));
    this.root.addEventListener('pointerdown', this.unlockAudio, { capture: true });
    this.showStart();
  }

  pause() {
    this.sound.pause();
  }

  resume() {
    this.sound.resume();
  }

  dispose() {
    this.disposed = true;
    this.round?.dispose();
    this.timers.clear();
    this.offMute();
    this.sound.dispose();
    this.confetti.dispose();
    this.root.remove();
  }

  private showStart() {
    this.screen++;
    this.reset(tr().title, '');
    this.stage.append(startScreen(this.sdk.profile?.name, () => void this.startRound(), () => void this.showAlbum()));
  }

  private async startRound() {
    const screen = ++this.screen;
    await this.progress.load();
    if (this.disposed || screen !== this.screen) return;
    const round = buildRound(this.progress.progress.level, this.progress.progress.found);
    this.reset(tr().roundTitle, tr().level(round.level));
    this.round = new RoundPlay(round, {
      root: this.root,
      stage: this.stage,
      sound: this.sound,
      confetti: this.confetti,
      timers: this.timers,
      onWin: (mistakes) => this.showWin(mistakes),
      answer: (ok) => this.sdk.progress.skill('animals', ok),
    });
  }

  private async showAlbum() {
    const screen = ++this.screen;
    await this.progress.load();
    if (this.disposed || screen !== this.screen) return;
    const found = new Set(this.progress.progress.found);
    this.reset(tr().albumTitle, tr().found(found.size, allAnimals.length));
    this.stage.append(
      albumScreen(found, () => this.showStart(), (card, animal, home, known) => {
        if (!known) return this.sound.say(tr().sayUnknown);
        this.sound.pick();
        this.timers.replayClass(card, 'is-bounce');
        this.sound.say(tr().sayLives(animalName(animal), homeWhere(home)));
      }),
    );
  }

  private showWin(mistakes: number) {
    const round = this.round!.round;
    void this.progress.completeRound(round.level, round.animals.map((a) => a.id));
    rewardRound(this.sdk.progress, round.level, mistakes, new Set([...this.progress.progress.found, ...round.animals.map((a) => a.id)]).size);
    this.confetti.burst();
    this.sound.win();
    this.sound.say(tr().sayWin);
    const win = winOverlay(mistakes <= 2 ? 3 : 2, () => void this.startRound(), () => this.showStart());
    this.stage.append(win.overlay);
    win.focus();
  }

  /** Новый экран: всё от прошлого (зверь в руке, подсказки, таймеры, конфетти) убирается. */
  private reset(title: string, badge: string) {
    this.round?.dispose();
    this.round = null;
    this.timers.clear();
    this.confetti.clear();
    this.title.textContent = title;
    this.badge.textContent = badge;
    this.stage.replaceChildren();
    this.stage.scrollTop = 0;
  }

  private unlockAudio = () => this.sound.unlock();
}
