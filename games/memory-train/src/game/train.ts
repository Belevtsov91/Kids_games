// Раунд паровозика: кто едет в вагонах и о чём спросим, когда поезд выедет из туннеля. Без DOM.

export const ANIMALS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🐷', '🐮', '🐵', '🦁', '🐯', '🐨', '🐧', '🐔', '🦉'];
export const MAX_LEVEL = 6;

export type Rand = () => number;

export type Question =
  | { kind: 'which'; wagon: number }
  | { kind: 'missing'; missing: number }
  | { kind: 'order' };

export interface Round {
  riders: string[];
  question: Question;
  /** Варианты ответа (для which и missing); для order — все пассажиры вперемешку. */
  options: string[];
  /** Сколько миллисекунд показываем поезд, пока он не уедет в туннель. */
  showMs: number;
}

const shuffle = <T>(items: readonly T[], rand: Rand) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Вагонов: уровень 1 — 2, уровень 6 — 6. */
export const wagonsFor = (level: number) => Math.min(6, level + 1);

export function makeRound(level: number, rand: Rand): Round {
  const n = wagonsFor(level);
  const pool = shuffle(ANIMALS, rand);
  const riders = pool.slice(0, n);
  const spare = pool.slice(n);
  const kinds: Question['kind'][] = level <= 1 ? ['which'] : level <= 2 ? ['which', 'missing'] : ['which', 'missing', 'order'];
  const kind = kinds[Math.floor(rand() * kinds.length)];
  const showMs = 1500 + n * 900;
  if (kind === 'order') return { riders, question: { kind }, options: shuffle(riders, rand), showMs };
  if (kind === 'missing') {
    const missing = Math.floor(rand() * n);
    const options = shuffle([riders[missing], ...shuffle(spare, rand).slice(0, 2), ...riders.filter((_, i) => i !== missing).slice(0, 1)], rand);
    return { riders, question: { kind, missing }, options, showMs };
  }
  const wagon = Math.floor(rand() * n);
  const others = shuffle(riders.filter((_, i) => i !== wagon), rand).slice(0, 2);
  const options = shuffle([riders[wagon], ...others, ...shuffle(spare, rand).slice(0, 4 - 1 - others.length)], rand);
  return { riders, question: { kind, wagon }, options, showMs };
}

/** Правильный ответ для which и missing. */
export const answerOf = (r: Round) => (r.question.kind === 'which' ? r.riders[r.question.wagon] : r.question.kind === 'missing' ? r.riders[r.question.missing] : null);

/** Порядок: верно ли ребёнок назвал очередного пассажира. */
export const orderStepOk = (r: Round, step: number, pick: string) => r.riders[step] === pick;
