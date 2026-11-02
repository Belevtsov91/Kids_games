import type { GameSdk } from '@ig/sdk';
import { buildBubbles, isUnlocked, layoutBubbles, pickWords, Round, starsFor, type Bubble } from './logic';
import { Monster } from './monster';
import { Sound } from './sound';
import { LETTER_NAMES, LEVELS, type Level, type Word } from './words';

type Attrs = Record<string, string | number | boolean | EventListener | undefined>;

/** Маленький помощник для DOM: текст попадает только в textContent, никакого innerHTML с данными. */
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: (Node | string | null | false)[]) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (typeof value === 'function') el.addEventListener(key, value);
    else if (key === 'class') el.className = String(value);
    else if (key.startsWith('--')) el.style.setProperty(key, String(value));
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children) if (child) el.append(child);
  return el;
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const PRAISE = ['Ням-ням!', 'Вкусно!', 'Молодец!', 'Ура!', 'Здорово!', 'Супер!', 'Отлично!'];

interface Progress {
  stars: number[];
}

export class LetterEater {
  private readonly root: HTMLElement;
  private readonly sound: Sound;
  private readonly monster = new Monster();
  private stars: number[] = LEVELS.map(() => 0);
  /** Прогресс сохраняется на сервере игры; без входа живёт только до выхода из игры. */
  private online = false;
  private cleanup: (() => void)[] = [];
  private screenToken = 0;
  private lookFrame = 0;

  // Состояние раунда.
  private level: Level = LEVELS[0];
  private words: Word[] = [];
  private roundIndex = 0;
  private round: Round | null = null;
  private totalMistakes = 0;
  private mistakesOnLetter = 0;
  private bubbleEls = new Map<number, HTMLButtonElement>();
  private slotEls: HTMLElement[] = [];
  private fieldEl: HTMLElement | null = null;

  constructor(
    container: HTMLElement,
    private readonly sdk: GameSdk,
  ) {
    this.sound = new Sound(sdk.audio.muted);
    this.root = h('div', { class: 'le-root' });
    this.root.append(
      h('div', { class: 'le-sky', 'aria-hidden': 'true' }, ...['🔤', '✏️', '📖', '⭐', '🅰️', '🎈'].map((e, i) => h('span', { '--i': i }, e))),
    );
    container.append(this.root);

    this.cleanup.push(sdk.audio.onMuteChange((muted) => this.sound.setMuted(muted)));
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(this.lookFrame);
      this.lookFrame = requestAnimationFrame(() => this.monster.lookAt(e.clientX, e.clientY));
    };
    const onKey = (e: KeyboardEvent) => this.onKey(e);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('keydown', onKey);
    this.cleanup.push(() => window.removeEventListener('pointermove', onMove), () => window.removeEventListener('keydown', onKey));

    this.showLevels();
    void this.loadProgress();
  }

  private async loadProgress() {
    try {
      const progress = await this.sdk.api.get<Progress>('/progress');
      this.online = true;
      const before = this.stars.join();
      this.stars = LEVELS.map((_, i) => Math.max(this.stars[i] ?? 0, progress.stars[i] ?? 0));
      // Перерисовываем экран уровней, только если звёзды правда изменились: без лишнего мигания.
      if (before !== this.stars.join() && this.root.querySelector('.le-levels')) this.showLevels();
    } catch {
      this.online = false;
    }
  }

  private async saveProgress(levelIndex: number, stars: number) {
    this.stars[levelIndex] = Math.max(this.stars[levelIndex] ?? 0, stars);
    if (!this.online) return;
    try {
      const progress = await this.sdk.api.post<Progress>('/progress', { level: levelIndex, stars });
      this.stars = LEVELS.map((_, i) => Math.max(this.stars[i] ?? 0, progress.stars[i] ?? 0));
    } catch {
      // Сеть пропала: звёзды остались в памяти игры, ребёнок играет дальше.
    }
  }

  /** Меняет экран. Токен отменяет отложенные действия предыдущего экрана. */
  private setScreen(screen: HTMLElement) {
    this.screenToken++;
    this.root.querySelector('.le-screen')?.remove();
    this.root.querySelector('.le-overlay')?.remove();
    screen.classList.add('le-screen');
    this.root.append(screen);
  }

  private button(label: string, onClick: () => void, cls = '', ariaLabel?: string) {
    return h('button', {
      type: 'button',
      class: `le-btn ${cls}`,
      'aria-label': ariaLabel,
      click: () => {
        this.sound.click();
        onClick();
      },
    }, label);
  }

  // ——— Экран уровней ———

  private showLevels() {
    this.round = null;
    this.monster.mood('idle');
    const name = this.sdk.profile?.name;
    const totalStars = this.stars.reduce((a, b) => a + b, 0);

    const cards = LEVELS.map((level, i) => {
      const unlocked = isUnlocked(i, this.stars);
      const stars = this.stars[i] ?? 0;
      return h(
        'button',
        {
          type: 'button',
          class: `le-level ${unlocked ? '' : 'is-locked'}`,
          '--i': i,
          disabled: !unlocked,
          'aria-label': `Уровень ${level.id}: ${level.title}${unlocked ? '' : ', закрыт'}`,
          click: () => {
            this.sound.pop();
            this.startLevel(i);
          },
        },
        h('span', { class: 'le-level-num' }, String(level.id)),
        h('span', { class: 'le-level-emoji' }, unlocked ? level.emoji : '🔒'),
        h('span', { class: 'le-level-title' }, level.title),
        h('span', { class: 'le-level-sample' }, level.words.slice(0, 3).map((w) => w.emoji).join(' ')),
        h('span', { class: 'le-level-stars', 'aria-label': `${stars} из 3 звёзд` }, ...[0, 1, 2].map((s) => h('i', { class: s < stars ? 'on' : '' }, '★'))),
      );
    });

    const monsterBox = h(
      'div',
      { class: 'le-hero' },
      h('div', { class: 'le-speech' }, name ? `${name}, покорми меня буквами!` : 'Покорми меня буквами!'),
      this.monster.el,
    );
    this.monster.el.onclick = () => {
      this.monster.mood('happy', 900);
      this.sound.chomp();
      this.sound.say('Ням-ням! Хочу буквы!');
    };

    this.setScreen(
      h(
        'div',
        { class: 'le-levels' },
        h(
          'header',
          { class: 'le-top' },
          this.button('✕', () => this.sdk.exit(), 'le-btn--round', 'Выйти из игры'),
          h('h1', { class: 'le-title' }, 'Буквоед'),
          h('div', { class: 'le-total', 'aria-label': `Всего звёзд: ${totalStars}` }, `★ ${totalStars}`),
        ),
        h('div', { class: 'le-levels-body' }, monsterBox, h('div', { class: 'le-level-grid' }, ...cards)),
        !this.online && this.sdk.profile === null ? h('p', { class: 'le-note' }, 'Войдите в профиль, чтобы звёзды сохранялись') : null,
      ),
    );
  }

  // ——— Игра ———

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
    this.round = new Round(word.word);
    this.mistakesOnLetter = 0;
    this.bubbleEls.clear();

    this.slotEls = [...word.word].map((letter, i) =>
      h('span', { class: 'le-slot', '--i': i }, h('span', { class: 'le-slot-ghost' }, this.level.ghostLetters ? letter : '')),
    );
    const dots = this.words.map((_, i) => h('i', { class: i < this.roundIndex ? 'done' : i === this.roundIndex ? 'now' : '' }));

    this.fieldEl = h('div', { class: 'le-field', role: 'group', 'aria-label': 'Буквы' });
    const card = h(
      'div',
      { class: 'le-card' },
      h('button', { type: 'button', class: 'le-picture', 'aria-label': 'Послушать слово', click: () => this.sayWord() }, word.emoji),
      h('div', { class: 'le-slots', '--n': word.word.length }, ...this.slotEls),
    );

    this.setScreen(
      h(
        'div',
        { class: 'le-play' },
        h(
          'header',
          { class: 'le-top' },
          this.button('←', () => this.showLevels(), 'le-btn--round', 'К уровням'),
          h('div', { class: 'le-dots', 'aria-label': `Слово ${this.roundIndex + 1} из ${this.words.length}` }, ...dots),
          h(
            'div',
            { class: 'le-tools' },
            this.button('🔊', () => this.sayWord(), 'le-btn--round', 'Послушать слово'),
            this.button('💡', () => this.hint(true), 'le-btn--round', 'Подсказка'),
          ),
        ),
        card,
        this.fieldEl,
        h('div', { class: 'le-stage' }, this.monster.el),
      ),
    );
    this.monster.mood('idle');
    this.placeBubbles(buildBubbles(word.word, this.level));

    if (this.level.speakAtStart) {
      const token = this.screenToken;
      window.setTimeout(() => token === this.screenToken && this.sayWord(), 450);
    }
  }

  private placeBubbles(bubbles: Bubble[]) {
    const field = this.fieldEl!;
    const rect = field.getBoundingClientRect();
    const aspect = rect.width && rect.height ? rect.width / rect.height : 1.4;
    const spots = layoutBubbles(bubbles.length, aspect);
    const hues = [8, 32, 50, 140, 175, 200, 265, 300, 330];
    bubbles.forEach((bubble, i) => {
      const el = h(
        'button',
        {
          type: 'button',
          class: 'le-bubble',
          'aria-label': `Буква ${bubble.letter}`,
          '--x': spots[i].x.toFixed(3),
          '--y': spots[i].y.toFixed(3),
          '--hue': hues[(bubble.letter.charCodeAt(0) + i) % hues.length],
          '--delay': `${(i * 0.06).toFixed(2)}s`,
          '--drift': `${(3 + (i % 4) * 0.7).toFixed(1)}s`,
          pointerdown: (e: Event) => {
            e.preventDefault();
            this.tapBubble(bubble, el);
          },
        },
        h('span', { class: 'le-bubble-in' }, bubble.letter),
      );
      // Клавиатура и экранные читалки: Enter/пробел тоже «касание».
      el.addEventListener('click', (e) => {
        if ((e as MouseEvent).detail === 0) this.tapBubble(bubble, el);
      });
      this.bubbleEls.set(bubble.id, el as HTMLButtonElement);
      field.append(el);
    });
  }

  private tapBubble(bubble: Bubble, el: HTMLElement) {
    const round = this.round;
    if (!round || round.finished || el.classList.contains('is-gone')) return;
    const slotIndex = round.eaten;
    const result = round.tap(bubble.letter);

    if (result === 'wrong') {
      this.totalMistakes++;
      this.mistakesOnLetter++;
      this.sound.wrong();
      this.monster.mood('sad', 700);
      el.classList.remove('is-wrong');
      void el.offsetWidth;
      el.classList.add('is-wrong');
      if (this.mistakesOnLetter >= 2) this.hint(false);
      return;
    }

    this.mistakesOnLetter = 0;
    this.clearHint();
    el.classList.add('is-gone');
    this.bubbleEls.delete(bubble.id);
    this.sound.pop();
    this.sound.say(LETTER_NAMES[bubble.letter] ?? bubble.letter, 1);
    void this.eat(el, slotIndex, bubble.letter, result === 'done');
  }

  /** Буква летит в рот монстрику, он жуёт, буква встаёт в своё место в слове. */
  private async eat(el: HTMLElement, slotIndex: number, letter: string, wordDone: boolean) {
    const token = this.screenToken;
    const from = el.getBoundingClientRect();
    const to = this.monster.mouthPoint();
    const dx = to.x - (from.left + from.width / 2);
    const dy = to.y - (from.top + from.height / 2);
    this.monster.mood('open');
    this.monster.lookAt(from.left + from.width / 2, from.top + from.height / 2);

    const flight = el.animate(
      [
        { transform: 'translate(0, 0) scale(1.15)', offset: 0.12 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(.9)`, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0.6 },
      ],
      { duration: 520, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' },
    );
    await flight.finished.catch(() => undefined);
    if (token !== this.screenToken) return;
    el.remove();
    this.monster.mood('chomp', 450);
    this.sound.chomp();

    const slot = this.slotEls[slotIndex];
    slot.replaceChildren(h('span', { class: 'le-slot-letter' }, letter));
    slot.classList.add('is-filled');

    if (wordDone) await this.wordComplete(token);
  }

  private async wordComplete(token: number) {
    const word = this.words[this.roundIndex];
    // Лишние буквы улетают.
    for (const el of this.bubbleEls.values()) el.classList.add('is-leaving');
    await wait(350);
    if (token !== this.screenToken) return;

    this.monster.mood('happy', 1600);
    this.sound.word();
    this.root.querySelector('.le-slots')?.classList.add('is-done');
    this.root.querySelector('.le-card')?.append(h('div', { class: 'le-praise' }, PRAISE[Math.floor(Math.random() * PRAISE.length)]));
    this.confetti(18);
    await wait(250);
    this.sound.say(word.word);
    await wait(1700);
    if (token !== this.screenToken) return;

    this.roundIndex++;
    if (this.roundIndex < this.words.length) this.startRound();
    else void this.levelComplete();
  }

  private async levelComplete() {
    const levelIndex = LEVELS.indexOf(this.level);
    const stars = starsFor(this.totalMistakes, this.words.length);
    const firstTime = (this.stars[levelIndex] ?? 0) === 0;
    void this.saveProgress(levelIndex, stars);
    const next = levelIndex + 1 < LEVELS.length ? levelIndex + 1 : null;

    this.sound.fanfare();
    this.monster.mood('happy');
    this.confetti(40);
    const name = this.sdk.profile?.name;
    const text = stars === 3 ? 'Идеально!' : stars === 2 ? 'Отлично!' : 'Получилось!';
    window.setTimeout(() => this.sound.say(name ? `${text} ${name}, ты молодец!` : `${text} Ты молодец!`), 600);

    this.root.querySelector('.le-overlay')?.remove();
    this.root.append(
      h(
        'div',
        { class: 'le-overlay', role: 'dialog', 'aria-label': 'Уровень пройден' },
        h(
          'div',
          { class: 'le-win' },
          h('div', { class: 'le-win-emoji' }, this.level.emoji),
          h('h2', {}, text),
          h('p', {}, `Монстрик съел ${this.words.length} слов!`),
          h('div', { class: 'le-win-stars' }, ...[0, 1, 2].map((s) => h('i', { class: s < stars ? 'on' : '', '--i': s }, '★'))),
          firstTime && next !== null ? h('p', { class: 'le-unlock' }, `Открыт уровень «${LEVELS[next].title}»`) : null,
          h(
            'div',
            { class: 'le-win-actions' },
            this.button('↻ Ещё раз', () => this.startLevel(levelIndex), 'le-btn--soft'),
            next !== null ? this.button('Дальше →', () => this.startLevel(next), 'le-btn--main') : this.button('К уровням', () => this.showLevels(), 'le-btn--main'),
          ),
          next !== null ? this.button('Все уровни', () => this.showLevels(), 'le-btn--link') : null,
        ),
      ),
    );
  }

  private sayWord() {
    const word = this.words[this.roundIndex];
    if (!word) return;
    this.sound.say(word.word, 0.75);
    this.monster.mood('open', 600);
  }

  /** Подсвечивает нужную букву. Подсказка по кнопке считается ошибкой, автоматическая — нет. */
  private hint(byButton: boolean) {
    const expected = this.round?.expected;
    if (!expected) return;
    if (byButton) this.totalMistakes++;
    this.sound.say(LETTER_NAMES[expected] ?? expected, 1);
    for (const el of this.bubbleEls.values()) {
      if (el.textContent === expected) el.classList.add('is-hint');
    }
    this.slotEls[this.round!.eaten]?.classList.add('is-next');
  }

  private clearHint() {
    for (const el of this.root.querySelectorAll('.is-hint, .is-next')) el.classList.remove('is-hint', 'is-next');
  }

  private onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (this.root.querySelector('.le-play')) this.showLevels();
      return;
    }
    if (!this.round || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    const letter = e.key.toUpperCase().replace('Ё', 'Е');
    if (!/[А-Я]/.test(letter)) return;
    const entries = [...this.bubbleEls.entries()].filter(([, el]) => el.textContent === letter);
    if (!entries.length) return;
    const [id, el] = entries[0];
    this.tapBubble({ id, letter }, el);
  }

  private confetti(count: number) {
    const layer = h('div', { class: 'le-confetti', 'aria-hidden': 'true' });
    const colors = ['#ff5d8f', '#ffb84d', '#ffe14d', '#5ce08a', '#4dc3ff', '#a98bff'];
    for (let i = 0; i < count; i++) {
      layer.append(
        h('i', {
          '--x': `${Math.random() * 100}%`,
          '--c': colors[i % colors.length],
          '--d': `${(Math.random() * 0.4).toFixed(2)}s`,
          '--r': `${Math.round(Math.random() * 720 - 360)}deg`,
          '--t': `${(1.2 + Math.random() * 0.9).toFixed(2)}s`,
        }),
      );
    }
    this.root.append(layer);
    window.setTimeout(() => layer.remove(), 2600);
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
    cancelAnimationFrame(this.lookFrame);
    this.cleanup.forEach((fn) => fn());
    this.monster.dispose();
    this.sound.dispose();
    this.root.remove();
  }
}
