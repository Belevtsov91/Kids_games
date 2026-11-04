import { useI18n } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/locale';
import { en } from './en';
import { ro } from './ro';
import { ru, type FamilyText } from './ru';
import { uk } from './uk';

const TEXTS: Record<Locale, FamilyText> = { ru, uk, ro, en };

export const familyText = (locale: Locale): FamilyText => TEXTS[locale] ?? ru;

/** Тексты мишки, плана дня, заданий дома и голосового привета на языке сайта. */
export function useFamilyText(): FamilyText {
  return familyText(useI18n().locale);
}
export type { FamilyText };
