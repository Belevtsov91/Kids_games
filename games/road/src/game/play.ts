// Правила прохождения: набор вопросов главы, проверка ответа, звёзды. Без DOM — покрыто тестами.
import { canGo, CHAPTERS, CHOICES, LIGHTS, type Chapter, type ChapterId, type Light, type Round } from './rounds';

export type Rand = () => number;

export const shuffle = <T>(items: readonly T[], rand: Rand) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export const chapterById = (id: ChapterId): Chapter => CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];

/** Сигналы подряд не повторяются, и в главе есть и «идём», и «стоим». */
export function lightSequence(size: number, rand: Rand): Light[] {
  const out: Light[] = [];
  while (out.length < size) {
    const options = LIGHTS.filter((l) => l !== out.at(-1));
    out.push(options[Math.floor(rand() * options.length)]);
  }
  if (!out.some(canGo)) out[size - 1] = out[size - 2] === 'green' ? 'walk' : 'green';
  if (out.every(canGo)) out[0] = out[1] === 'red' ? 'stop' : 'red';
  return out;
}

/** Вопросы одного прохождения главы; варианты ответа в каждом вопросе перемешаны. */
export function buildRounds(id: ChapterId, rand: Rand): Round[] {
  const chapter = chapterById(id);
  if (id === 'light') return lightSequence(chapter.size, rand).map((light) => ({ kind: 'light', id: light }));
  return shuffle(CHOICES[id], rand)
    .slice(0, chapter.size)
    .map((r) => ({ ...r, options: shuffle(r.options, rand) }));
}

export type Answer = 'go' | 'wait' | string;

/** Верен ли ответ: для светофора — «идём»/«стоим», для вопроса — id варианта. */
export function isRight(round: Round, answer: Answer): boolean {
  if (round.kind === 'light') return (answer === 'go') === canGo(round.id);
  return round.options.some((o) => o.id === answer && o.ok);
}

/** Звёзды за главу: без ошибок — 3, одна-две — 2, больше — 1. */
export const starsFor = (mistakes: number) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
