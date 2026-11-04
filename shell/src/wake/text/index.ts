import { useI18n } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/locale';
import { en } from './en';
import { ro } from './ro';
import { ru, type WakeText } from './ru';
import { uk } from './uk';

const TEXTS: Record<Locale, WakeText> = { ru, uk, ro, en };

/** Через сколько секунд ожидания показывать следующую подсказку. */
export const WAKE_HINT_STEPS = [0, 10, 24, 42] as const;

/** Тексты экрана «Мишка просыпается» на языке сайта. */
export function useWakeText(): WakeText {
  return TEXTS[useI18n().locale];
}

export type { WakeText };
