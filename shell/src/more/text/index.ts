import { useI18n } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/locale';
import { en } from './en';
import { ro } from './ro';
import { ru, type MoreText } from './ru';
import { uk } from './uk';

const TEXTS: Record<Locale, MoreText> = { ru, uk, ro, en };

/** Тексты новых страниц на языке сайта. */
export function useMoreText(): MoreText {
  return TEXTS[useI18n().locale];
}
export type { MoreText };
