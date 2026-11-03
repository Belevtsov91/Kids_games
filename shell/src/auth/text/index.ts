import { useI18n } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/locale';
import { en } from './en';
import { ro } from './ro';
import { ru, type AuthText } from './ru';
import { uk } from './uk';

const TEXTS: Record<Locale, AuthText> = { ru, uk, ro, en };

/** Тексты страниц входа на языке сайта. */
export function useAuthText(): AuthText {
  return TEXTS[useI18n().locale];
}

export type { AuthText };
