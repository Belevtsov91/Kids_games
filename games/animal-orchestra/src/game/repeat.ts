// Без DOM: «Повтори за мной». Зверята играют фразу, ребёнок повторяет.
// Ошибка не наказывается: фраза просто звучит ещё раз.

export type RepeatResult = 'ok' | 'done' | 'miss';

export interface RepeatOptions {
  /** Все id зверей по порядку. */
  animals: readonly string[];
  /** Случайное число [0, 1). */
  random?: () => number;
}

const START_LENGTH = 2;
const MAX_LENGTH = 8;

export class RepeatGame {
  level = 1;
  stars = 0;
  phrase: string[] = [];
  private pos = 0;
  private readonly random: () => number;

  constructor(private readonly options: RepeatOptions) {
    this.random = options.random ?? Math.random;
  }

  /** Сколько нот во фразе на текущем уровне. */
  get length() {
    return Math.min(START_LENGTH + Math.floor((this.level - 1) / 2), MAX_LENGTH);
  }

  /** Сколько зверей участвует: сначала трое, потом все. */
  get poolSize() {
    return Math.min(3 + Math.floor((this.level - 1) / 2), this.options.animals.length);
  }

  /** Чей ход сейчас ждём. */
  get expected() {
    return this.phrase[this.pos];
  }

  get progress() {
    return this.pos;
  }

  /** Новая фраза для текущего уровня. Соседние ноты не повторяются — так их легче различить. */
  newPhrase(): string[] {
    const pool = this.options.animals.slice(0, this.poolSize);
    const phrase: string[] = [];
    while (phrase.length < this.length) {
      const pick = pool[Math.floor(this.random() * pool.length)];
      if (pick !== phrase[phrase.length - 1]) phrase.push(pick);
    }
    this.phrase = phrase;
    this.pos = 0;
    return phrase;
  }

  /** Ребёнок нажал на зверя. */
  answer(animalId: string): RepeatResult {
    if (animalId !== this.phrase[this.pos]) {
      this.pos = 0;
      return 'miss';
    }
    this.pos++;
    if (this.pos < this.phrase.length) return 'ok';
    this.stars++;
    this.level++;
    return 'done';
  }

  /** Снова слушать ту же фразу с начала. */
  restartPhrase() {
    this.pos = 0;
  }
}
