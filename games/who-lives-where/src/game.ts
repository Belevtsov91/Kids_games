import type { GameSdk } from '@ig/sdk';
import { allAnimals, habitatOf, habitats, type Animal, type Habitat } from './data';
import { buildRound, emptyProgress, mergeProgress, type Progress, type Round } from './rounds';
import { Confetti } from './confetti';
import { Sound } from './sound';

const HINT_AFTER_MS = 8000;
const DRAG_THRESHOLD = 8;

interface Drag {
  token: HTMLButtonElement;
  animal: Animal;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  over: HTMLElement | null;
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

/** Вся игра: стартовый экран, раунд с перетаскиванием, альбом найденных зверей. */
export class WhoLivesWhere {
  private readonly root = el('div', 'wlw');
  private readonly title = el('h1', 'wlw-title');
  private readonly badge = el('div', 'wlw-badge');
  private readonly stage = el('main', 'wlw-stage');
  private readonly confetti: Confetti;
  private readonly sound: Sound;
  private readonly offMute: () => void;

  private progress: Progress = emptyProgress();
  private progressLoad: Promise<void> | null = null;
  private round: Round | null = null;
  private placed = new Set<string>();
  private mistakes = new Map<string, number>();
  private selected: { token: HTMLButtonElement; animal: Animal } | null = null;
  private drag: Drag | null = null;
  private hintTimer = 0;
  private timers = new Set<number>();

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
    this.cancelDrag();
    clearTimeout(this.hintTimer);
    this.timers.forEach(clearTimeout);
    this.offMute();
    this.sound.dispose();
    this.confetti.dispose();
    this.root.remove();
  }

  // ---------- экраны ----------

  private showStart() {
    this.reset('Кто где живёт?');
    this.badge.textContent = '';
    const screen = el('section', 'wlw-start');

    const parade = el('div', 'wlw-parade');
    parade.setAttribute('aria-hidden', 'true');
    ['🐄', '🦊', '🐳', '🐧', '🦁', '🐸'].forEach((emoji, i) => {
      const span = el('span', '', emoji);
      span.style.animationDelay = `${i * 0.15}s`;
      parade.append(span);
    });

    const name = this.sdk.profile?.name;
    const lead = el('p', 'wlw-lead', name ? `${name}, помоги зверятам найти свой дом!` : 'Помоги зверятам найти свой дом!');

    const play = el('button', 'wlw-btn wlw-btn-play', '▶ Играть');
    play.addEventListener('click', () => void this.startRound());
    const album = el('button', 'wlw-btn wlw-btn-soft', '📖 Альбом зверят');
    album.addEventListener('click', () => void this.showAlbum());

    const actions = el('div', 'wlw-actions');
    actions.append(play, album);
    screen.append(parade, lead, actions);
    this.stage.append(screen);
  }

  private async startRound() {
    await this.loadProgress();
    this.reset('Отведи зверят домой!');
    const round = buildRound(this.progress.level, this.progress.found);
    this.round = round;
    this.badge.textContent = `Уровень ${round.level}`;

    const screen = el('section', 'wlw-play');
    const homes = el('div', 'wlw-homes');
    homes.dataset.count = String(round.homes.length);
    for (const home of round.homes) homes.append(this.homeCard(home));

    const dots = el('div', 'wlw-dots');
    dots.setAttribute('aria-label', `Дома ${0} из ${round.animals.length}`);
    round.animals.forEach(() => dots.append(el('span')));

    const tray = el('div', 'wlw-tray');
    tray.setAttribute('aria-label', 'Зверята');
    round.animals.forEach((animal, i) => tray.append(this.animalToken(animal, i)));

    screen.append(homes, dots, tray);
    this.stage.append(screen);
    this.sound.say('Помоги зверятам найти свой дом!');
    this.scheduleHint();
  }

  private async showAlbum() {
    await this.loadProgress();
    this.reset('Альбом зверят');
    const found = new Set(this.progress.found);
    this.badge.textContent = `${found.size} из ${allAnimals.length}`;

    const screen = el('section', 'wlw-album');
    const back = el('button', 'wlw-btn wlw-btn-soft wlw-btn-small', '‹ Назад');
    back.addEventListener('click', () => this.showStart());
    screen.append(back);

    for (const home of habitats) {
      const group = el('div', `wlw-album-home wlw-scene-${home.id}`);
      group.append(el('h2', '', `${home.emoji} ${home.title}`));
      const row = el('div', 'wlw-album-row');
      for (const animal of home.animals) {
        const known = found.has(animal.id);
        const card = el('button', `wlw-album-animal${known ? '' : ' is-unknown'}`);
        card.append(el('span', 'wlw-emoji', animal.emoji), el('small', '', known ? animal.name : '?'));
        card.setAttribute('aria-label', known ? animal.name : 'Ещё не найден');
        card.addEventListener('click', () => {
          if (!known) return this.sound.say('Этого зверька ты ещё не встречал. Играй, и он найдётся!');
          this.sound.pick();
          this.bounce(card);
          this.sound.say(`${animal.name} живёт ${home.where}`);
        });
        row.append(card);
      }
      group.append(row);
      screen.append(group);
    }
    this.stage.append(screen);
  }

  private showWin() {
    const round = this.round!;
    const totalMistakes = [...this.mistakes.values()].reduce((a, b) => a + b, 0);
    const stars = totalMistakes <= 2 ? 3 : 2;
    this.progress = mergeProgress(this.progress, { level: round.level + 1, found: round.animals.map((a) => a.id) });
    void this.saveProgress();

    this.confetti.burst();
    this.sound.win();
    this.sound.say('Ура! Все зверята дома! Молодец!');

    const overlay = el('div', 'wlw-win');
    const card = el('div', 'wlw-win-card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Победа');
    const starsRow = el('div', 'wlw-stars');
    for (let i = 0; i < 3; i++) {
      const star = el('span', i < stars ? 'is-on' : '', '⭐');
      star.style.animationDelay = `${0.2 + i * 0.2}s`;
      starsRow.append(star);
    }
    const next = el('button', 'wlw-btn wlw-btn-play', 'Дальше ▶');
    next.addEventListener('click', () => void this.startRound());
    const menu = el('button', 'wlw-btn wlw-btn-soft', '🏠 Меню');
    menu.addEventListener('click', () => this.showStart());
    const actions = el('div', 'wlw-actions');
    actions.append(next, menu);
    card.append(starsRow, el('h2', '', 'Молодец!'), el('p', '', 'Все зверята дома'), actions);
    overlay.append(card);
    this.stage.append(overlay);
    next.focus({ preventScroll: true });
  }

  // ---------- элементы раунда ----------

  private homeCard(home: Habitat) {
    const card = el('div', `wlw-home wlw-scene-${home.id}`);
    card.dataset.home = home.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', home.title);
    card.append(el('span', 'wlw-home-emoji', home.emoji), el('span', 'wlw-home-title', home.title), el('div', 'wlw-home-residents'));
    const choose = () => {
      if (this.selected) this.tryPlace(this.selected.token, this.selected.animal, card);
      else {
        this.sound.say(home.title);
        this.bounce(card);
      }
    };
    card.addEventListener('click', choose);
    card.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), choose()));
    return card;
  }

  private animalToken(animal: Animal, index: number) {
    const token = el('button', 'wlw-animal');
    token.dataset.animal = animal.id;
    // Появление — через Web Animations, а не CSS: CSS-анимация перебивала бы transform при перетаскивании.
    if (typeof token.animate === 'function') {
      token.animate([{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], {
        duration: 450,
        delay: index * 60,
        easing: 'cubic-bezier(.3,1.6,.5,1)',
        fill: 'backwards',
      });
    }
    token.setAttribute('aria-label', animal.name);
    token.append(el('span', 'wlw-emoji', animal.emoji), el('span', 'wlw-animal-name', animal.name));

    token.addEventListener('pointerdown', (e) => {
      if (this.drag || e.button > 0) return;
      e.preventDefault();
      token.setPointerCapture(e.pointerId);
      this.drag = { token, animal, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, moved: false, over: null };
    });
    token.addEventListener('pointermove', (e) => this.onDragMove(e));
    token.addEventListener('pointerup', (e) => this.onDragEnd(e));
    token.addEventListener('pointercancel', () => this.cancelDrag());
    // Клавиатура: Enter/пробел выбирают зверя, затем Enter на доме.
    token.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.select(token, animal);
      }
    });
    return token;
  }

  private onDragMove(e: PointerEvent) {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      this.deselect();
      drag.token.classList.add('is-dragging');
      this.sound.pick();
      this.sound.say(drag.animal.name);
      this.clearHint();
    }
    drag.token.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
    const over = this.homeAt(e.clientX, e.clientY);
    if (over !== drag.over) {
      drag.over?.classList.remove('is-over');
      over?.classList.add('is-over');
      drag.over = over;
    }
  }

  private onDragEnd(e: PointerEvent) {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    this.drag = null;
    drag.over?.classList.remove('is-over');
    if (!drag.moved) return this.select(drag.token, drag.animal);
    const home = this.homeAt(e.clientX, e.clientY);
    if (home) this.tryPlace(drag.token, drag.animal, home);
    else {
      this.sound.drop();
      this.returnToken(drag.token);
      this.scheduleHint();
    }
  }

  private cancelDrag() {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    drag.over?.classList.remove('is-over');
    this.returnToken(drag.token);
  }

  private select(token: HTMLButtonElement, animal: Animal) {
    const same = this.selected?.token === token;
    this.deselect();
    if (same) return;
    this.selected = { token, animal };
    token.classList.add('is-selected');
    this.root.classList.add('has-selection');
    this.sound.pick();
    this.sound.say(`${animal.name}. Где живёт ${animal.name.toLowerCase()}?`);
    this.clearHint();
    this.scheduleHint();
  }

  private deselect() {
    this.selected?.token.classList.remove('is-selected');
    this.root.classList.remove('has-selection');
    this.selected = null;
  }

  private tryPlace(token: HTMLButtonElement, animal: Animal, homeCard: HTMLElement) {
    const home = habitatOf(animal.id)!;
    this.deselect();
    this.clearHint();

    if (homeCard.dataset.home !== home.id) {
      this.mistakes.set(animal.id, (this.mistakes.get(animal.id) ?? 0) + 1);
      this.sound.wrong();
      this.sound.say(`Ой, не здесь! Где живёт ${animal.name.toLowerCase()}?`);
      this.restartAnimation(homeCard, 'is-wrong');
      this.returnToken(token);
      this.restartAnimation(token, 'is-wobble');
      // Два промаха подряд — сразу подсказываем правильный дом.
      if ((this.mistakes.get(animal.id) ?? 0) >= 2) this.showHint(animal.id);
      else this.scheduleHint();
      return;
    }

    this.placed.add(animal.id);
    this.sound.correct();
    this.sound.say(`${animal.name} живёт ${home.where}!`);
    this.flyHome(token, animal, homeCard);
    this.updateDots();

    if (this.placed.size === this.round!.animals.length) this.later(() => this.showWin(), 900);
    else this.scheduleHint();
  }

  /** Зверь перелетает из лотка в дом; в лотке остаётся пустое место, чтобы раскладка не прыгала. */
  private flyHome(token: HTMLButtonElement, animal: Animal, homeCard: HTMLElement) {
    const residents = homeCard.querySelector<HTMLElement>('.wlw-home-residents')!;
    const resident = el('span', 'wlw-resident', animal.emoji);
    resident.setAttribute('aria-label', animal.name);
    resident.style.visibility = 'hidden';
    residents.append(resident);

    const rootBox = this.root.getBoundingClientRect();
    const from = token.querySelector('.wlw-emoji')!.getBoundingClientRect();
    const to = resident.getBoundingClientRect();
    token.classList.remove('is-dragging');
    token.style.transform = '';
    token.classList.add('is-gone');
    token.disabled = true;

    const flyer = el('span', 'wlw-flyer', animal.emoji);
    flyer.style.left = `${from.left - rootBox.left}px`;
    flyer.style.top = `${from.top - rootBox.top}px`;
    flyer.style.width = `${from.width}px`;
    flyer.style.height = `${from.height}px`;
    this.root.append(flyer);

    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const scale = to.height / from.height;
    const land = () => {
      flyer.remove();
      resident.style.visibility = '';
      resident.classList.add('is-new');
      this.bounce(homeCard);
      this.confetti.sparkle(to.left - rootBox.left + to.width / 2, to.top - rootBox.top + to.height / 2);
    };
    if (typeof flyer.animate !== 'function') return land();
    const animation = flyer.animate(
      [
        { transform: 'translate(0, 0) scale(1.15)' },
        { transform: `translate(${dx / 2}px, ${dy / 2 - 60}px) scale(${(1.15 + scale) / 2 + 0.2})`, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      ],
      { duration: 520, easing: 'cubic-bezier(.3,.7,.4,1)' },
    );
    animation.onfinish = land;
    animation.oncancel = land;
  }

  private returnToken(token: HTMLButtonElement) {
    token.classList.remove('is-dragging');
    token.classList.add('is-returning');
    token.style.transform = '';
    this.later(() => token.classList.remove('is-returning'), 320);
  }

  private updateDots() {
    const dots = this.stage.querySelector<HTMLElement>('.wlw-dots');
    if (!dots || !this.round) return;
    [...dots.children].forEach((dot, i) => dot.classList.toggle('is-on', i < this.placed.size));
    dots.setAttribute('aria-label', `Дома ${this.placed.size} из ${this.round.animals.length}`);
  }

  // ---------- подсказки ----------

  /** Если ребёнок долго ничего не делает — дом для выбранного (или первого оставшегося) зверя мигает. */
  private scheduleHint() {
    clearTimeout(this.hintTimer);
    this.hintTimer = window.setTimeout(() => {
      const animal = this.selected?.animal ?? this.round?.animals.find((a) => !this.placed.has(a.id));
      if (animal && !this.drag) this.showHint(animal.id);
    }, HINT_AFTER_MS);
  }

  private showHint(animalId: string) {
    const home = habitatOf(animalId);
    const token = this.stage.querySelector<HTMLElement>(`.wlw-animal[data-animal="${animalId}"]`);
    const card = this.stage.querySelector<HTMLElement>(`.wlw-home[data-home="${home?.id}"]`);
    token?.classList.add('is-hint');
    card?.classList.add('is-hint');
  }

  private clearHint() {
    clearTimeout(this.hintTimer);
    this.stage.querySelectorAll('.is-hint').forEach((node) => node.classList.remove('is-hint'));
  }

  // ---------- прогресс на сервере игры ----------

  /** Прогресс грузим по первому нажатию, а не при запуске: до игры он не нужен. */
  private loadProgress() {
    this.progressLoad ??= this.sdk.api
      .get<Progress>('/progress')
      .then((saved) => void (this.progress = mergeProgress(this.progress, saved)))
      .catch(() => undefined); // Нет сети или сессии — играем с начала, без сохранения.
    return this.progressLoad;
  }

  private async saveProgress() {
    try {
      this.progress = mergeProgress(this.progress, await this.sdk.api.post<Progress>('/progress', this.progress));
    } catch {
      // Не сохранилось — не страшно: в следующий раз начнём с последнего сохранённого уровня.
    }
  }

  // ---------- мелочи ----------

  private reset(title: string) {
    this.cancelDrag();
    this.deselect();
    this.clearHint();
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.confetti.clear();
    this.round = null;
    this.placed = new Set();
    this.mistakes = new Map();
    this.title.textContent = title;
    this.stage.replaceChildren();
    this.stage.scrollTop = 0;
  }

  private homeAt(x: number, y: number): HTMLElement | null {
    const pad = 12;
    for (const card of this.stage.querySelectorAll<HTMLElement>('.wlw-home')) {
      const r = card.getBoundingClientRect();
      if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) return card;
    }
    return null;
  }

  private bounce(node: HTMLElement) {
    this.restartAnimation(node, 'is-bounce');
  }

  private restartAnimation(node: HTMLElement, className: string) {
    node.classList.remove(className);
    void node.offsetWidth; // перезапуск CSS-анимации
    node.classList.add(className);
    this.later(() => node.classList.remove(className), 700);
  }

  private later(fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
  }

  private unlockAudio = () => this.sound.unlock();
}
