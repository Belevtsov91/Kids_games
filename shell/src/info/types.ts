import type { ReactNode } from 'react';

/** Адреса информационных страниц (открыты всем, вход не нужен). */
export const INFO_SLUGS = ['privacy', 'terms', 'cookies', 'kids', 'delete-account', 'credits', 'about', 'parents', 'help', 'contact'] as const;
export type InfoSlug = (typeof INFO_SLUGS)[number];

export interface InfoContent {
  /** Короткое имя для ссылок в подвале. */
  label: string;
  title: string;
  /** Надпись над заголовком: «Документ», «Родителям»… */
  eyebrow: string;
  /** Цвет акцента страницы. */
  color: string;
  icon: string;
  /** «Коротко»: суть страницы в двух предложениях. */
  summary?: ReactNode;
  /** Показывать дату редакции (для документов). */
  dated?: boolean;
  body: ReactNode;
}
