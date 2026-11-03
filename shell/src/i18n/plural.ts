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

/** «5 лет», «3 роки», «7 ani», «2 years». */
export const age = (locale: Locale, n: number) => `${n} ${years(locale, n)}`;

/** Диапазон возраста: «3–8 лет», «3–8 років», «3–8 ani», «3–8 years». Слово берётся по верхней границе. */
export const ageRange = (locale: Locale, min: number, max: number) => `${min}–${max} ${years(locale, max)}`;
