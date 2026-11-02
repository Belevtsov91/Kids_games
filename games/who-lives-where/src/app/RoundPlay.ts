import type { Sound } from '../audio/Sound';
import { habitatOf, type Animal } from '../game/data';
import type { Round } from '../game/rounds';
import type { Confetti } from '../ui/Confetti';
import { animalToken, flyHome, homeAt, homeCard, roundScreen } from '../ui/roundView';
import { AnimalPicker } from './AnimalPicker';
import type { Timers } from './Timers';

// Один раунд: зверят надо отвести по домам. Ошибки, подсказки и победа.

/** Через сколько бездействия мигает подсказка. */
const HINT_AFTER_MS = 8000;

interface RoundHost {
  root: HTMLElement;
  stage: HTMLElement;
  sound: Sound;
  confetti: Confetti;
  timers: Timers;
  /** Все зверята дома; `mistakes` — сколько было промахов. */
  onWin(mistakes: number): void;
}

export class RoundPlay {
  private readonly placed = new Set<string>();
  private readonly mistakes = new Map<string, number>();
  private readonly picker: AnimalPicker;
  private hintTimer = 0;

  constructor(
    readonly round: Round,
    private readonly host: RoundHost,
  ) {
    const { sound, stage } = host;
    this.picker = new AnimalPicker({
      root: host.root,
      homeAt: (x, y) => homeAt(stage, x, y),
      onLift: (animal) => {
        sound.pick();
        sound.say(animal.name);
        this.clearHint();
      },
      onSelect: (animal) => {
        sound.pick();
        sound.say(`${animal.name}. Где живёт ${animal.name.toLowerCase()}?`);
        this.clearHint();
        this.scheduleHint();
      },
      onDrop: (token, animal, home) => {
        if (home) return this.tryPlace(token, animal, home);
        sound.drop();
        this.returnToken(token);
        this.scheduleHint();
      },
      onCancel: (token) => this.returnToken(token),
    });

    const screen = roundScreen(
      round,
      (home) =>
        homeCard(home, (card) => {
          const picked = this.picker.selected;
          if (picked) return this.tryPlace(picked.token, picked.animal, card);
          sound.say(home.title);
          host.timers.replayClass(card, 'is-bounce');
        }),
      (animal, i) => {
        const token = animalToken(animal, i);
        this.picker.attach(token, animal);
        return token;
      },
    );
    stage.append(screen);
    sound.say('Помоги зверятам найти свой дом!');
    this.scheduleHint();
  }

  /** Раунд закончился или экран сменился: отпустить зверя, убрать подсказки. */
  dispose() {
    this.picker.cancel();
    this.picker.deselect();
    this.clearHint();
  }

  private tryPlace(token: HTMLButtonElement, animal: Animal, card: HTMLElement) {
    const { sound, timers } = this.host;
    const home = habitatOf(animal.id)!;
    this.picker.deselect();
    this.clearHint();

    if (card.dataset.home !== home.id) {
      const misses = (this.mistakes.get(animal.id) ?? 0) + 1;
      this.mistakes.set(animal.id, misses);
      sound.wrong();
      sound.say(`Ой, не здесь! Где живёт ${animal.name.toLowerCase()}?`);
      timers.replayClass(card, 'is-wrong');
      this.returnToken(token);
      timers.replayClass(token, 'is-wobble');
      // Два промаха подряд — сразу подсказываем правильный дом.
      if (misses >= 2) this.showHint(animal.id);
      else this.scheduleHint();
      return;
    }

    this.placed.add(animal.id);
    sound.correct();
    sound.say(`${animal.name} живёт ${home.where}!`);
    flyHome(this.host.root, token, animal, card, (x, y) => {
      timers.replayClass(card, 'is-bounce');
      this.host.confetti.sparkle(x, y);
    });
    this.updateDots();

    if (this.placed.size === this.round.animals.length) {
      const total = [...this.mistakes.values()].reduce((a, b) => a + b, 0);
      timers.later(() => this.host.onWin(total), 900);
    } else this.scheduleHint();
  }

  private returnToken(token: HTMLButtonElement) {
    token.classList.remove('is-dragging');
    token.classList.add('is-returning');
    token.style.transform = '';
    this.host.timers.later(() => token.classList.remove('is-returning'), 320);
  }

  private updateDots() {
    const dots = this.host.stage.querySelector<HTMLElement>('.wlw-dots');
    if (!dots) return;
    [...dots.children].forEach((dot, i) => dot.classList.toggle('is-on', i < this.placed.size));
    dots.setAttribute('aria-label', `Дома ${this.placed.size} из ${this.round.animals.length}`);
  }

  /** Если ребёнок долго ничего не делает — дом для выбранного (или первого оставшегося) зверя мигает. */
  private scheduleHint() {
    clearTimeout(this.hintTimer);
    this.hintTimer = window.setTimeout(() => {
      const animal = this.picker.selected?.animal ?? this.round.animals.find((a) => !this.placed.has(a.id));
      if (animal && !this.picker.dragging) this.showHint(animal.id);
    }, HINT_AFTER_MS);
  }

  private showHint(animalId: string) {
    const { stage } = this.host;
    const home = habitatOf(animalId);
    stage.querySelector(`.wlw-animal[data-animal="${animalId}"]`)?.classList.add('is-hint');
    stage.querySelector(`.wlw-home[data-home="${home?.id}"]`)?.classList.add('is-hint');
  }

  private clearHint() {
    clearTimeout(this.hintTimer);
    this.host.stage.querySelectorAll('.is-hint').forEach((node) => node.classList.remove('is-hint'));
  }
}
