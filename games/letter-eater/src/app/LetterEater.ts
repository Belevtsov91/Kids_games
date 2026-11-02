import type { GameSdk } from '@ig/sdk';
import { ProgressStore } from '../api/progress';
import { Sound } from '../audio/Sound';
import { pickWords, starsFor } from '../game/logic';
import { LEVELS, type Level, type Word } from '../game/words';
import { confetti } from '../ui/confetti';
import { h } from '../ui/dom';
import { Monster } from '../ui/Monster';
import { playScreen } from '../ui/playScreen';
import { levelsScreen, winOverlay, type ButtonFactory } from '../ui/screens';
import { WordRound } from './WordRound';

// Контроллер Буквоеда: экран уровней, слова уровня по очереди и финал.

export class LetterEater {
  private readonly root = h('div', { class: 'le-root' });
  private readonly sound: Sound;
  private readonly monster = new Monster();
  private readonly progress: ProgressStore;
  private readonly cleanup: (() => void)[] = [];
  /** Растёт при смене экрана: отложенные действия старого экрана видят, что устарели. */
  private screenToken = 0;

  // Состояние уровня и текущего слова.
  private level: Level = LEVELS[0];
  private words: Word[] = [];
  private roundIndex = 0;
  /** Текущее слово; null на экране уровней. */
  private round: WordRound | null = null;
  private totalMistakes = 0;

  constructor(
    container: HTMLElement,
    private readonly sdk: GameSdk,
  ) {
    this.sound = new Sound(sdk.audio.muted);
    this.progress = new ProgressStore(sdk.api);
    this.root.append(h('div', { class: 'le-sky', 'aria-hidden': 'true' }, ...['🔤', '✏️', '📖', '⭐', '🅰️', '🎈'].map((e, i) => h('span', { '--i': i }, e))));
    container.append(this.root);

    const onKey = (e: KeyboardEvent) => this.onKey(e);
    window.addEventListener('keydown', onKey);
    this.cleanup.push(
      sdk.audio.onMuteChange((muted) => this.sound.setMuted(muted)),
      this.monster.followPointer(),
      () => window.removeEventListener('keydown', onKey),
    );

    this.showLevels();
    // Перерисовываем экран уровней, только если звёзды правда изменились: без лишнего мигания.
    void this.progress.load().then((changed) => changed && this.root.querySelector('.le-levels') && this.showLevels());
  }

  pause() {
    this.root.classList.add('is-paused');
    this.sound.stopSpeech();
  }

  resume() {
    this.root.classList.remove('is-paused');
  }

  dispose() {
    this.screenToken++;
    this.cleanup.forEach((fn) => fn());
    this.monster.dispose();
    this.sound.dispose();
    this.root.remove();
  }

  private button: ButtonFactory = (label, onClick, cls = '', ariaLabel) =>
    h('button', { type: 'button', class: `le-btn ${cls}`, 'aria-label': ariaLabel, click: () => (this.sound.click(), onClick()) }, label);

  /** Меняет экран. Токен отменяет отложенные действия предыдущего экрана. */
  private setScreen(screen: HTMLElement) {
    this.screenToken++;
    this.root.querySelector('.le-screen')?.remove();
    this.root.querySelector('.le-overlay')?.remove();
    screen.classList.add('le-screen');
    this.root.append(screen);
  }

  private showLevels() {
    this.round = null;
    this.monster.mood('idle');
    this.monster.el.onclick = () => {
      this.monster.mood('happy', 900);
      this.sound.chomp();
      this.sound.say('Ням-ням! Хочу буквы!');
    };
    this.setScreen(
      levelsScreen({
        stars: this.progress.stars,
        childName: this.sdk.profile?.name,
        loginNote: !this.progress.online && this.sdk.profile === null,
        monster: this.monster.el,
        button: this.button,
        onPick: (i) => {
          this.sound.pop();
          this.startLevel(i);
        },
        onExit: () => this.sdk.exit(),
      }),
    );
  }

  private startLevel(index: number) {
    this.level = LEVELS[index];
    this.words = pickWords(this.level);
    this.roundIndex = 0;
    this.totalMistakes = 0;
    this.monster.el.onclick = null;
    this.startRound();
  }

  private startRound() {
    const word = this.words[this.roundIndex];
    const screen = playScreen({
      word,
      index: this.roundIndex,
      total: this.words.length,
      ghostLetters: !!this.level.ghostLetters,
      monster: this.monster.el,
      button: this.button,
      onBack: () => this.showLevels(),
      onSay: () => this.sayWord(),
      onHint: () => this.round?.hint(true),
    });
    this.setScreen(screen.el);
    this.monster.mood('idle');
    const token = this.screenToken;
    this.round = new WordRound(word, this.level, screen.field, screen.slots, {
      root: this.root,
      sound: this.sound,
      monster: this.monster,
      alive: () => token === this.screenToken,
      addMistake: () => this.totalMistakes++,
      onDone: () => this.nextWord(),
    });
    if (this.level.speakAtStart) window.setTimeout(() => token === this.screenToken && this.sayWord(), 450);
  }

  private nextWord() {
    this.roundIndex++;
    if (this.roundIndex < this.words.length) this.startRound();
    else this.levelComplete();
  }

  private levelComplete() {
    const levelIndex = LEVELS.indexOf(this.level);
    const stars = starsFor(this.totalMistakes, this.words.length);
    const firstTime = (this.progress.stars[levelIndex] ?? 0) === 0;
    void this.progress.save(levelIndex, stars);
    const next = levelIndex + 1 < LEVELS.length ? levelIndex + 1 : null;

    this.sound.fanfare();
    this.monster.mood('happy');
    confetti(this.root, 40);
    const name = this.sdk.profile?.name;
    const title = stars === 3 ? 'Идеально!' : stars === 2 ? 'Отлично!' : 'Получилось!';
    window.setTimeout(() => this.sound.say(name ? `${title} ${name}, ты молодец!` : `${title} Ты молодец!`), 600);

    this.root.querySelector('.le-overlay')?.remove();
    this.root.append(
      winOverlay({
        level: this.level,
        title,
        wordCount: this.words.length,
        stars,
        unlocked: firstTime && next !== null ? LEVELS[next] : null,
        hasNext: next !== null,
        button: this.button,
        onRetry: () => this.startLevel(levelIndex),
        onNext: () => next !== null && this.startLevel(next),
        onLevels: () => this.showLevels(),
      }),
    );
  }

  private sayWord() {
    const word = this.words[this.roundIndex];
    if (!word) return;
    this.sound.say(word.word, 0.75);
    this.monster.mood('open', 600);
  }

  /** Esc — к уровням; русская буква на клавиатуре — нажать такой пузырь. */
  private onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (this.root.querySelector('.le-play')) this.showLevels();
      return;
    }
    if (!this.round || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    const letter = e.key.toUpperCase().replace('Ё', 'Е');
    if (!/[А-Я]/.test(letter)) return;
    this.round.tapLetter(letter);
  }
}
