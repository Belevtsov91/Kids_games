import { useI18n } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/locale';
import { en } from './en';
import { ro } from './ro';
import { ru, type KidText } from './ru';
import { uk } from './uk';

const TEXTS: Record<Locale, KidText> = { ru, uk, ro, en };

/** Тексты страниц ребёнка на языке сайта. */
export function useKidText(): KidText {
  return TEXTS[useI18n().locale];
}

export type { KidText };
