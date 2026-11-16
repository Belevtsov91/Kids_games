import { useI18n } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/locale';
import { en } from './en';
import { ro } from './ro';
import { ru, type DashText } from './ru';
import { uk } from './uk';

const TEXTS: Record<Locale, DashText> = { ru, uk, ro, en };

/** Тексты переключателя вида дашборда на языке сайта. */
export function useDashText(): DashText {
  return TEXTS[useI18n().locale] ?? ru;
}
