import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Lang } from '../api/types';
import { ru, type Dict } from './ru';
import { uk } from './uk';
import { ro } from './ro';
import { en } from './en';

// Четыре языка интерфейса, как на основном сайте. Русский — основной: в нём есть все ключи,
// остальные словари обязаны совпадать по ключам (это проверяет тип Dict и тест).

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'ru', label: 'Русский' },
  { id: 'uk', label: 'Українська' },
  { id: 'ro', label: 'Română' },
  { id: 'en', label: 'English' },
];
export const DICTS: Record<Lang, Dict> = { ru, uk, ro, en };
export type Key = keyof Dict;

const STORE = 'console.lang';
const initial = (): Lang => {
  try {
    const saved = localStorage.getItem(STORE) as Lang | null;
    if (saved && saved in DICTS) return saved;
  } catch {
    /* хранилище недоступно — берём язык браузера */
  }
  const nav = navigator.language.slice(0, 2) as Lang;
  return nav in DICTS ? nav : 'ru';
};

/** Подстановка: «{n} из {total}». */
export const fill = (text: string, vars?: Record<string, string | number>) =>
  vars ? text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : text;

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  /** Дата и время в часовом поясе владельца, по правилам выбранного языка. */
  when: (iso: string | null | undefined, withTime?: boolean) => string;
  num: (n: number) => string;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);
  const value = useMemo<I18n>(() => {
    const dict = DICTS[lang];
    const date = new Intl.DateTimeFormat(lang, { day: '2-digit', month: '2-digit', year: 'numeric' });
    const dateTime = new Intl.DateTimeFormat(lang, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const number = new Intl.NumberFormat(lang);
    return {
      lang,
      setLang: (next) => {
        setLangState(next);
        document.documentElement.lang = next;
        try {
          localStorage.setItem(STORE, next);
        } catch {
          /* не страшно: язык останется до перезагрузки */
        }
      },
      t: (key, vars) => fill(dict[key] ?? ru[key] ?? key, vars),
      when: (iso, withTime = true) => (iso ? (withTime ? dateTime : date).format(new Date(iso)) : '—'),
      num: (n) => number.format(n),
    };
  }, [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('I18nProvider is missing');
  return ctx;
}
