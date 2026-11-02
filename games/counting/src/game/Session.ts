import { createQuestion, type Mode, type Question } from './logic';
import { ROUNDS } from './themes';

// Сессия из ROUNDS заданий одного режима. Без DOM и звука: только правила и счёт звёзд.

export class Session {
  question: Question;
  /** Посчитанные предметы (режим «совместный счёт»), в порядке нажатия. */
  readonly counted = new Set<number>();
  /** Сколько еды собрано (режим «кормление»). */
  food = 0;
  round = 1;
  stars = 0;
  solved = false;
  private firstTry = true;

  constructor(
    readonly mode: Mode,
    private readonly limit: number,
    private readonly random: () => number = Math.random,
  ) {
    this.question = createQuestion(mode, limit, random);
  }

  get isLastRound() {
    return this.round >= ROUNDS;
  }

  /** Следующее задание сессии. */
  next() {
    this.round++;
    this.question = createQuestion(this.mode, this.limit, this.random);
    this.counted.clear();
    this.food = 0;
    this.firstTry = true;
    this.solved = false;
  }

  /** Звезда — только за ответ с первой попытки; после ошибки можно пробовать без ограничений. null — уже решено. */
  answer(value: number): 'right' | 'wrong' | null {
    if (this.solved) return null;
    if (value !== this.question.answer) {
      this.firstTry = false;
      return 'wrong';
    }
    this.solved = true;
    if (this.firstTry) this.stars++;
    return 'right';
  }

  /** Отмечает предмет посчитанным. false — он уже был посчитан. */
  count(index: number) {
    if (this.counted.has(index)) return false;
    this.counted.add(index);
    return true;
  }

  addFood(delta: number) {
    this.food = Math.max(0, Math.min(this.limit, this.food + delta));
  }

  clear() {
    this.counted.clear();
    this.food = 0;
  }
}
