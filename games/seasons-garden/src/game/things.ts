// Загадки сезонов: предметы и то, к какому времени года они относятся.
import { nextSeason, SEASONS, type Season } from './seasons';

export interface Thing {
  id: string;
  emoji: string;
  seasons: Season[];
}

export const THINGS: Thing[] = [
  { id: 'snowman', emoji: '⛄', seasons: ['winter'] },
  { id: 'sled', emoji: '🛷', seasons: ['winter'] },
  { id: 'mitten', emoji: '🧤', seasons: ['winter'] },
  { id: 'skates', emoji: '⛸️', seasons: ['winter'] },
  { id: 'tulip', emoji: '🌷', seasons: ['spring'] },
  { id: 'nest', emoji: '🪺', seasons: ['spring'] },
  { id: 'sprout', emoji: '🌱', seasons: ['spring'] },
  { id: 'strawberry', emoji: '🍓', seasons: ['summer'] },
  { id: 'icecream', emoji: '🍦', seasons: ['summer'] },
  { id: 'sunflower', emoji: '🌻', seasons: ['summer'] },
  { id: 'swim', emoji: '🩱', seasons: ['summer'] },
  { id: 'mushroom', emoji: '🍄', seasons: ['autumn'] },
  { id: 'pumpkin', emoji: '🎃', seasons: ['autumn'] },
  { id: 'leaf', emoji: '🍂', seasons: ['autumn'] },
  { id: 'butterfly', emoji: '🦋', seasons: ['spring', 'summer'] },
  { id: 'umbrella', emoji: '☂️', seasons: ['spring', 'autumn'] },
];

export const MAX_LEVEL = 5;

/**
 * Виды загадок по уровням:
 * fits — что бывает в этот сезон (1 подходит из 3 или 4); odd — что лишнее (3 подходят, 1 нет);
 * which — в какое время года бывает предмет; next — что наступит после этого сезона.
 */
export type Question =
  | { kind: 'fits' | 'odd'; season: Season; options: Thing[]; answer: string }
  | { kind: 'which'; thing: Thing; options: Season[]; answer: Season }
  | { kind: 'next'; season: Season; options: Season[]; answer: Season };

const shuffle = <T>(list: T[], rnd: () => number) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

const pick = <T>(list: readonly T[], rnd: () => number): T => list[Math.min(list.length - 1, Math.floor(rnd() * list.length))]!;

export function makeQuestion(level: number, rnd: () => number): Question {
  const season = pick(SEASONS, rnd);
  const inSeason = THINGS.filter((t) => t.seasons.includes(season));
  const outSeason = THINGS.filter((t) => !t.seasons.includes(season));
  if (level <= 2) {
    const right = pick(inSeason, rnd);
    const options = shuffle([right, ...shuffle(outSeason, rnd).slice(0, level === 1 ? 2 : 3)], rnd);
    return { kind: 'fits', season, options, answer: right.id };
  }
  if (level === 3) {
    const wrong = pick(outSeason, rnd);
    return { kind: 'odd', season, options: shuffle([wrong, ...shuffle(inSeason, rnd).slice(0, 3)], rnd), answer: wrong.id };
  }
  if (level === 4) {
    const thing = pick(THINGS.filter((t) => t.seasons.length === 1), rnd);
    return { kind: 'which', thing, options: [...SEASONS], answer: thing.seasons[0]! };
  }
  return { kind: 'next', season, options: [...SEASONS], answer: nextSeason(season) };
}

export const answerOk = (q: Question, picked: string) => q.answer === picked;
