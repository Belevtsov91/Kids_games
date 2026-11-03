// Выбор следующей ситуации и вариантов ответа. Случайность передаётся снаружи — так тесты предсказуемы.
import type { Emotion } from './emotions';
import { SCENARIOS, type Scenario } from './scenarios';
import type { Progress } from './progress';

export type Rand = () => number;

const shuffle = <T>(items: readonly T[], rand: Rand) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Следующая ситуация: среди открытых эмоций — та, что практиковали меньше всего; не повторяем прошлую. */
export function nextScenario(open: readonly Emotion[], p: Progress, lastId: string | null, rand: Rand): Scenario {
  const pool = SCENARIOS.filter((s) => open.includes(s.emotion) && s.id !== lastId);
  const min = Math.min(...pool.map((s) => p.rooms[s.emotion] ?? 0));
  const weakest = pool.filter((s) => (p.rooms[s.emotion] ?? 0) === min);
  return weakest[Math.floor(rand() * weakest.length)];
}

/** Три варианта эмоции: верный и два других из открытых, в случайном порядке. */
export function emotionChoices(answer: Emotion, open: readonly Emotion[], rand: Rand): Emotion[] {
  const others = shuffle(open.filter((e) => e !== answer), rand).slice(0, 2);
  return shuffle([answer, ...others], rand);
}
