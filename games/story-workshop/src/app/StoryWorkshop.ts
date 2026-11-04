import type { GameSdk } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import { addTale, allHeroes, readProgress, type Progress } from '../game/progress';
import { EMOJI, type Tale } from '../game/story';
import { nameOf, tell } from '../game/tell';
import { tr } from '../i18n';
import { Comic } from '../ui/comic';
import { Confetti } from '../ui/Confetti';
import { applyComfort, button, el } from '../ui/dom';
import { Builder } from './Builder';
import { Timers } from './Timers';

/** Вся игра: мастерская (старт), сочинение новой сказки и полка с готовыми. */
export class StoryWorkshop {
  private readonly root = el('div', 'st');
  private readonly title = el('h1', 'st-title');
  private readonly badge = el('div', 'st-badge');
  private readonly stage = el('main', 'st-stage');
  private readonly sound: Sound;
  private readonly confetti: Confetti;
  private readonly timers = new Timers();
  private readonly offMute: () => void;
  private readonly offEnding: () => void;
  private progress: Progress;

  constructor(container: HTMLElement, private readonly sdk: GameSdk) {
    const top = el('header', 'st-top');
    top.append(this.title, this.badge);
    this.root.append(top, this.stage);
    container.appendChild(this.root);
    this.confetti = new Confetti(this.root);
    this.sound = new Sound(sdk.audio.muted);
    this.offMute = sdk.audio.onMuteChange((m) => this.sound.setMuted(m));
    this.sound.setVolume(sdk.comfort.effectsVolume);
    applyComfort(this.root, 'st', sdk.comfort);
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
    const screen = el('section', 'st-start');
    screen.append(
      el('div', 'st-hero', '📖✨'),
      el('p', 'st-lead', tr().lead(this.sdk.profile?.name)),
      button('st-btn st-btn-play', tr().newTale, () => this.compose()),
      button('st-btn st-btn-soft', tr().shelf(this.progress.tales.length), () => this.showShelf()),
    );
    this.stage.append(screen);
  }

  private compose() {
    this.reset(tr().title);
    new Builder({
      stage: this.stage,
      sound: this.sound,
      timers: this.timers,
      setBadge: (t) => (this.badge.textContent = t),
      onDone: (tale, comic, wrap) => this.done(tale, comic, wrap),
    });
  }

  private done(tale: Tale, comic: Comic, wrap: HTMLElement) {
    this.progress = addTale(this.progress, tale);
    this.sdk.storage.save('progress', this.progress);
    this.sdk.progress.skill('creativity', true);
    this.sdk.progress.skill('reading', true);
    this.sdk.progress.sticker('first-tale');
    if (this.progress.made >= 5) this.sdk.progress.sticker('storyteller');
    if (allHeroes(this.progress)) this.sdk.progress.sticker('all-heroes');
    comic.openAll();
    this.sound.win();
    this.confetti.burst();
    this.timers.later(() => this.sound.say(tr().sayDone), 900);
    wrap.querySelector('.st-coach')?.remove();
    wrap.append(this.readActions(tale, () => this.showHome()));
  }

  private readActions(tale: Tale, back: () => void) {
    const actions = el('div', 'st-actions');
    const read = button('st-btn st-btn-play', tr().readAll, () => this.sound.say(tell(tale, tr().words).join(' ')));
    actions.append(read, button('st-btn st-btn-soft', tr().newTale, () => this.compose()), button('st-btn st-btn-soft', tr().home, back));
    return actions;
  }

  private showShelf() {
    this.reset(tr().title);
    this.badge.textContent = tr().shelf(this.progress.tales.length);
    const wrap = el('section', 'st-shelf');
    if (!this.progress.tales.length) wrap.append(el('p', 'st-lead', tr().empty));
    const grid = el('div', 'st-grid');
    for (const tale of this.progress.tales) {
      const card = button('st-card st-book', '', () => this.openTale(tale));
      card.append(el('span', 'st-card-emoji', `${EMOJI[tale.hero]}${EMOJI[tale.item]}`), el('span', 'st-card-name', nameOf(tale, tr().words, tr().and)));
      grid.append(card);
    }
    wrap.append(grid, button('st-btn st-btn-soft', tr().home, () => this.showHome()));
    this.stage.append(wrap);
  }

  private openTale(tale: Tale) {
    this.reset(nameOf(tale, tr().words, tr().and));
    const wrap = el('section', 'st-tell');
    wrap.append(new Comic(tale, tell(tale, tr().words), true).node, this.readActions(tale, () => this.showShelf()));
    this.stage.append(wrap);
    this.sound.say(tell(tale, tr().words).join(' '));
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
