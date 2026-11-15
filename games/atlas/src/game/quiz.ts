// Вопросы маршрута: флаги, столицы, города и «найди на глобусе». Без DOM: всё проверяется тестами.
import { COUNTRIES, LOOKALIKES, country, distance, inRegion, type CountryId, type Region } from './countries';

export type Kind =
  /** Показан флаг — выбрать страну. */
  | 'flag'
  /** Названа страна — выбрать её флаг. */
  | 'flagOf'
  /** Названа страна — выбрать столицу. */
  | 'capital'
  /** Названа столица — выбрать страну. */
  | 'capitalOf'
  /** Назван город — выбрать страну (только дома: Молдова, Украина, Румыния). */
  | 'city'
  /** Названа страна — найти её среди меток на глобусе. */
  | 'globe';

export interface Question {
  kind: Kind;
  answer: CountryId;
  /** Варианты — всегда страны; как их показать (флаг, название, столица, метка), решает экран. */
  options: CountryId[];
  /** Для вопроса про город: номер города страны в словаре (0–2). */
  city?: number;
}

export type Rand = () => number;

export const ROUND_SIZE = 10;
const KINDS: Record<Region, Kind[]> = {
  home: ['flagOf', 'capital', 'city', 'globe', 'capitalOf', 'flag', 'city'],
  europe: ['flag', 'capital', 'flagOf', 'globe', 'capitalOf'],
  world: ['flag', 'globe', 'capital', 'flagOf', 'capitalOf'],
};

export const shuffle = <T>(items: readonly T[], rand: Rand): T[] => {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Ближайшие к стране столицы, без тех, что почти совпадают с ней (метки не должны слипаться). */
export const neighbours = (id: CountryId, minGap = 0) => {
  const self = country(id);
  return COUNTRIES.filter((c) => c.id !== id && distance(self, c) >= minGap)
    .sort((a, b) => distance(self, a) - distance(self, b))
    .map((c) => c.id);
};

/** Добирает варианты из списков по порядку, пока их не станет нужное число. */
const fill = (answer: CountryId, count: number, ...sources: CountryId[][]) => {
  const picked = new Set<CountryId>([answer]);
  for (const list of sources) for (const id of list) if (picked.size < count) picked.add(id);
  return [...picked];
};

export const distractors = (kind: Kind, answer: CountryId, region: Region, rand: Rand): CountryId[] => {
  const own = shuffle(inRegion(region).map((c) => c.id), rand);
  const near = neighbours(answer);
  if (kind === 'city') return fill(answer, 3, own);
  if (kind === 'globe') {
    // Соседей с расстоянием не меньше 6°, чтобы метки были различимы; из ближайших восьми — три случайных.
    return fill(answer, 4, shuffle(neighbours(answer, 6).slice(0, 8), rand));
  }
  if (kind === 'flag' || kind === 'flagOf') {
    return fill(answer, 4, shuffle(LOOKALIKES[answer] ?? [], rand), own, near);
  }
  return fill(answer, 4, own, near);
};

/** Маршрут из ROUND_SIZE вопросов: страны идут по кругу, типы вопросов чередуются. */
export const buildRound = (region: Region, rand: Rand, size = ROUND_SIZE): Question[] => {
  const pool = inRegion(region).map((c) => c.id);
  let order: CountryId[] = [];
  const kinds = shuffle(KINDS[region], rand);
  const questions: Question[] = [];
  for (let i = 0; i < size; i++) {
    if (!order.length) order = shuffle(pool, rand);
    const answer = order.pop()!;
    const kind = kinds[i % kinds.length];
    const q: Question = { kind, answer, options: shuffle(distractors(kind, answer, region, rand), rand) };
    if (kind === 'city') q.city = Math.floor(rand() * 3);
    questions.push(q);
  }
  return questions;
};

/** Звёзды за маршрут: 10 из 10 — три, от 8 — две, от 6 — одна. */
export const starsFor = (correct: number, total: number) => {
  const ratio = total ? correct / total : 0;
  return ratio >= 1 ? 3 : ratio >= 0.8 ? 2 : ratio >= 0.6 ? 1 : 0;
};
