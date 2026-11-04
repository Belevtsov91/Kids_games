import type { Locale } from './locale';

/** Слово «год/лет» после числа на каждом языке. */
function years(locale: Locale, n: number): string {
  const d = n % 10, dd = n % 100;
  const few = d >= 2 && d <= 4 && (dd < 12 || dd > 14);
  switch (locale) {
    case 'ru':
      return d === 1 && dd !== 11 ? 'год' : few ? 'года' : 'лет';
    case 'uk':
      return d === 1 && dd !== 11 ? 'рік' : few ? 'роки' : 'років';
    case 'ro':
      return n === 1 ? 'an' : n === 0 || (dd >= 1 && dd <= 19) ? 'ani' : 'de ani';
    case 'en':
      return n === 1 ? 'year' : 'years';
  }
}

/** «20 игр», «21 гра», «20 de jocuri», «20 games». */
export function gameCount(locale: Locale, n: number): string {
  const d = n % 10, dd = n % 100;
  const one = d === 1 && dd !== 11;
  const few = d >= 2 && d <= 4 && (dd < 12 || dd > 14);
  switch (locale) {
    case 'ru':
      return `${n} ${one ? 'игра' : few ? 'игры' : 'игр'}`;
    case 'uk':
      return `${n} ${one ? 'гра' : few ? 'гри' : 'ігор'}`;
    case 'ro':
      return n === 1 ? '1 joc' : n === 0 || (dd >= 1 && dd <= 19) ? `${n} jocuri` : `${n} de jocuri`;
    case 'en':
      return n === 1 ? '1 game' : `${n} games`;
  }
}

/** «5 лет», «3 роки», «7 ani», «2 years». */
export const age = (locale: Locale, n: number) => `${n} ${years(locale, n)}`;

/** Диапазон возраста: «3–8 лет», «3–8 років», «3–8 ani», «3–8 years». Слово берётся по верхней границе. */
export const ageRange = (locale: Locale, min: number, max: number) => `${min}–${max} ${years(locale, max)}`;
