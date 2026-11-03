import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { GameManifest } from '@ig/sdk';
import { DICTS, type Dict } from './dict';
import { localeStore, type Locale } from './locale';

interface I18n {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Тексты интерфейса на выбранном языке. */
  t: Dict;
}

const Ctx = createContext<I18n | null>(null);

/** Даёт всем страницам текущий язык и тексты; при смене языка перерисовывает всё дерево. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(localeStore.subscribe, localeStore.get);
  return <Ctx.Provider value={{ locale, setLocale: localeStore.set, t: DICTS[locale] }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(Ctx);
  if (!value) throw new Error('useI18n: нет I18nProvider выше по дереву');
  return value;
}

/** Название игры на языке сайта (из манифеста игры), иначе основное. */
export const gameTitle = (game: GameManifest, locale: Locale) => game.titles?.[locale] ?? game.title;
