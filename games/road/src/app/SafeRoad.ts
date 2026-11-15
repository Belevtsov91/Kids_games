import type { GameSdk } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import { buildRounds, isRight, starsFor, type Answer } from '../game/play';
import { isHero, readProgress, recordChapter, type Progress } from '../game/progress';
import type { Chapter, Round } from '../game/rounds';
import { tr } from '../i18n';
import { Confetti } from '../ui/Confetti';
import { applyComfort, button, el } from '../ui/dom';
import { Scene } from '../ui/scene';
import { doneOverlay, menuScreen, questionOf, RoundPanel, ruleOf } from '../ui/screens';
import { Timers } from './Timers';

const STICKER: Record<string, string> = { light: 'traffic-light', crossing: 'zebra', lost: 'found' };

/** Вся игра: выбор главы, вопросы с Тёпой на дороге, звёзды в конце. */
export class SafeRoad {
  private readonly root = el('div', 'sr');
  private readonly title = el('h1', 'sr-title');
  private readonly badge = el('div', 'sr-badge');
  private readonly stage = el('main', 'sr-stage');
  private readonly sound: Sound;
  private readonly confetti: Confetti;
  private readonly timers = new Timers();
  private readonly offMute: () => void;
  private readonly offEnding: () => void;
  private progress: Progress;

  constructor(container: HTMLElement, private readonly sdk: GameSdk) {
    const top = el('header', 'sr-top');
    top.append(this.title, this.badge);
    this.root.append(top, this.stage);
    container.appendChild(this.root);
    this.confetti = new Confetti(this.root);
    this.sound = new Sound(sdk.audio.muted);
    this.offMute = sdk.audio.onMuteChange((m) => this.sound.setMuted(m));
    this.sound.setVolume(sdk.comfort.effectsVolume);
    applyComfort(this.root, 'sr', sdk.comfort);
    this.offEnding = sdk.time.onEnding(() => this.sound.say(tr().sayEnding));
    this.root.addEventListener('pointerdown', this.unlock, { capture: true });
    this.progress = readProgress(sdk.storage.load('progress'));
    this.showMenu();
  }

  pause() {
    this.sound.pause();
  }

  resume() {
    this.sound.resume();
  }

  dispose() {
    this.reset('');
    this.root.removeEventListener('pointerdown', this.unlock, { capture: true });
    this.offMute();
    this.offEnding();
    this.sound.dispose();
    this.confetti.dispose();
    this.root.remove();
  }

  private showMenu() {
    this.reset(tr().title);
    this.sound.say(tr().lead(this.sdk.profile?.name));
    this.stage.append(menuScreen(this.sdk.profile?.name, this.progress, (c) => this.play(c)));
  }

  private play(chapter: Chapter) {
    this.reset(tr().chapters[chapter.id]);
    const rounds = buildRounds(chapter.id, Math.random);
    const scene = new Scene(chapter);
    const panel = new RoundPanel();
    const screen = el('section', 'sr-play');
    screen.append(button('sr-btn sr-btn-soft sr-btn-small sr-back', tr().back, () => this.showMenu()), scene.node, panel.node);
    this.stage.append(screen);
    let index = 0;
    let mistakes = 0;

    const ask = () => {
      const round = rounds[index];
      this.badge.textContent = tr().step(index + 1, rounds.length);
      scene.setLight(round.kind === 'light' ? round.id : null);
      panel.show(round, (answer, btn) => onAnswer(round, answer, btn));
      this.sound.say(index === 0 ? `${tr().chapterLead[chapter.id]} ${questionOf(round)}` : questionOf(round));
    };

    const onAnswer = (round: Round, answer: Answer, btn: HTMLButtonElement) => {
      if (btn.disabled) return;
      const ok = isRight(round, answer);
      this.sdk.progress.skill('logic', ok);
      if (!ok) {
        mistakes++;
        this.sound.wrong();
        this.sound.say(tr().sayWrong);
        panel.shake(btn);
        if (round.kind === 'light' && answer === 'go') scene.carPass();
        scene.startle();
        return;
      }
      this.sound.correct();
      this.sound.say(tr().sayRight(ruleOf(round)));
      // У светофора Тёпа переходит сам или ждёт машину; в других главах идёт шаг за шагом.
      if (round.kind === 'light') (answer === 'go' ? scene.cross() : scene.carPass());
      else {
        scene.setPos((index + 1) / rounds.length);
        scene.hop();
      }
      panel.right(btn, ruleOf(round), () => {
        index++;
        if (index < rounds.length) ask();
        else this.timers.later(() => this.done(chapter, starsFor(mistakes)), 300);
      });
    };

    ask();
  }

  private done(chapter: Chapter, stars: number) {
    this.progress = recordChapter(this.progress, chapter.id, stars);
    this.sdk.storage.save('progress', this.progress);
    this.sdk.progress.level(chapter.id);
    this.sdk.progress.skill('routine', true);
    this.sdk.progress.sticker(STICKER[chapter.id]);
    if (isHero(this.progress)) this.sdk.progress.sticker('road-hero');
    this.sound.win();
    this.sound.say(tr().sayDone(stars));
    this.confetti.burst();
    const o = doneOverlay(stars, () => this.play(chapter), () => this.showMenu());
    this.stage.append(o.overlay);
    o.focus();
  }

  private reset(title: string) {
    this.timers.clear();
    this.confetti.clear();
    this.title.textContent = title;
    this.badge.textContent = '';
    this.stage.replaceChildren();
  }

  private unlock = () => this.sound.unlock();
}
