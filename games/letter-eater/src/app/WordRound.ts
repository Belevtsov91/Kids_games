import type { Sound } from '../audio/Sound';
import { buildBubbles, Round, type Bubble } from '../game/logic';
import { LETTER_NAMES, type Level, type Word } from '../game/words';
import { confetti } from '../ui/confetti';
import { h, randomItem, replayClass, wait } from '../ui/dom';
import type { Monster } from '../ui/Monster';
import { placeBubbles } from '../ui/playScreen';

// Одно слово: ребёнок кормит монстрика буквами по порядку, ошибки и подсказки, финальная похвала.

const PRAISE = ['Ням-ням!', 'Вкусно!', 'Молодец!', 'Ура!', 'Здорово!', 'Супер!', 'Отлично!'];

interface RoundHost {
  root: HTMLElement;
  sound: Sound;
  monster: Monster;
  /** Экран этого слова ещё на месте (ребёнок не ушёл к уровням). */
  alive(): boolean;
  /** Ошибка или подсказка по кнопке — влияет на звёзды за уровень. */
  addMistake(): void;
  /** Слово собрано и похвала отыграла. */
  onDone(): void;
}

export class WordRound {
  private readonly round: Round;
  private readonly bubbleEls: Map<number, HTMLButtonElement>;
  private mistakesOnLetter = 0;

  constructor(
    private readonly word: Word,
    level: Level,
    field: HTMLElement,
    private readonly slotEls: HTMLElement[],
    private readonly host: RoundHost,
  ) {
    this.round = new Round(word.word);
    this.bubbleEls = placeBubbles(field, buildBubbles(word.word, level), (bubble, el) => this.tap(bubble, el));
  }

  tap(bubble: Bubble, el: HTMLElement) {
    const { round, host } = this;
    if (round.finished || el.classList.contains('is-gone')) return;
    const slotIndex = round.eaten;
    const result = round.tap(bubble.letter);

    if (result === 'wrong') {
      host.addMistake();
      this.mistakesOnLetter++;
      host.sound.wrong();
      host.monster.mood('sad', 700);
      replayClass(el, 'is-wrong');
      if (this.mistakesOnLetter >= 2) this.hint(false);
      return;
    }

    this.mistakesOnLetter = 0;
    this.clearHint();
    el.classList.add('is-gone');
    this.bubbleEls.delete(bubble.id);
    host.sound.pop();
    host.sound.say(LETTER_NAMES[bubble.letter] ?? bubble.letter, 1);
    void this.eat(el, slotIndex, bubble.letter, result === 'done');
  }

  /** Буква с клавиатуры: нажимает первый такой пузырь. */
  tapLetter(letter: string) {
    const entry = [...this.bubbleEls.entries()].find(([, el]) => el.textContent === letter);
    if (entry) this.tap({ id: entry[0], letter }, entry[1]);
  }

  /** Подсвечивает нужную букву. Подсказка по кнопке считается ошибкой, автоматическая — нет. */
  hint(byButton: boolean) {
    const expected = this.round.expected;
    if (!expected) return;
    if (byButton) this.host.addMistake();
    this.host.sound.say(LETTER_NAMES[expected] ?? expected, 1);
    for (const el of this.bubbleEls.values()) if (el.textContent === expected) el.classList.add('is-hint');
    this.slotEls[this.round.eaten]?.classList.add('is-next');
  }

  private clearHint() {
    for (const el of this.host.root.querySelectorAll('.is-hint, .is-next')) el.classList.remove('is-hint', 'is-next');
  }

  /** Буква летит в рот монстрику, он жуёт, буква встаёт в своё место в слове. */
  private async eat(el: HTMLElement, slotIndex: number, letter: string, wordDone: boolean) {
    const { host } = this;
    await host.monster.swallow(el);
    if (!host.alive()) return;
    el.remove();
    host.monster.mood('chomp', 450);
    host.sound.chomp();

    const slot = this.slotEls[slotIndex];
    slot.replaceChildren(h('span', { class: 'le-slot-letter' }, letter));
    slot.classList.add('is-filled');
    if (wordDone) await this.complete();
  }

  private async complete() {
    const { host } = this;
    // Лишние буквы улетают.
    for (const el of this.bubbleEls.values()) el.classList.add('is-leaving');
    await wait(350);
    if (!host.alive()) return;

    host.monster.mood('happy', 1600);
    host.sound.word();
    host.root.querySelector('.le-slots')?.classList.add('is-done');
    host.root.querySelector('.le-card')?.append(h('div', { class: 'le-praise' }, randomItem(PRAISE)));
    confetti(host.root, 18);
    await wait(250);
    host.sound.say(this.word.word);
    await wait(1700);
    if (host.alive()) host.onDone();
  }
}
