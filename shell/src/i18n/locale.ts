import { isLocale, LOCALES, type Locale } from '@ig/sdk';

// Выбранный язык сайта. Хранится в localStorage: это не секрет, просто настройка, как звук.
const KEY = 'ig:lang';
const DEFAULT: Locale = 'ru';
const listeners = new Set<(locale: Locale) => void>();

export { LOCALES, type Locale };

/** Подписи на кнопках переключателя. */
export const LOCALE_LABELS: Record<Locale, string> = { ru: 'RU', uk: 'UA', ro: 'RO', en: 'EN' };
/** Полные названия языков (для подсказок и экранного диктора). */
export const LOCALE_NAMES: Record<Locale, string> = { ru: 'Русский', uk: 'Українська', ro: 'Română', en: 'English' };
/** Атрибут lang у <html>. */
const HTML_LANG: Record<Locale, string> = { ru: 'ru', uk: 'uk', ro: 'ro', en: 'en' };

function read(): Locale {
  try {
    const saved = localStorage.getItem(KEY);
    return isLocale(saved) ? saved : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

let current = read();

export const localeStore = {
  get: () => current,
  set(locale: Locale) {
    if (locale === current) return;
    current = locale;
    try {
      localStorage.setItem(KEY, locale);
    } catch {
      // приватный режим: язык просто не запомнится
    }
    document.documentElement.lang = HTML_LANG[locale];
    listeners.forEach((listener) => listener(locale));
  },
  subscribe(listener: (locale: Locale) => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
};

if (typeof document !== 'undefined') document.documentElement.lang = HTML_LANG[current];
