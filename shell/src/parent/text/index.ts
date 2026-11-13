import { useI18n } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/locale';
import { en } from './en';
import { en2 } from './en2';
import { ro } from './ro';
import { ro2 } from './ro2';
import { ru, type ParentTextA } from './ru';
import { ru2, type ParentTextB } from './ru2';
import { uk } from './uk';
import { uk2 } from './uk2';
import { ru3, type ParentTextC } from './ru3';
import { uk3 } from './uk3';
import { ro3 } from './ro3';
import { en3 } from './en3';
import { ru4, type ParentTextD } from './ru4';
import { uk4 } from './uk4';
import { ro4 } from './ro4';
import { en4 } from './en4';

export type ParentText = ParentTextA & ParentTextB & ParentTextC & ParentTextD;

const TEXTS: Record<Locale, ParentText> = {
  ru: { ...ru, ...ru2, ...ru3, ...ru4 },
  uk: { ...uk, ...uk2, ...uk3, ...uk4 },
  ro: { ...ro, ...ro2, ...ro3, ...ro4 },
  en: { ...en, ...en2, ...en3, ...en4 },
};

/** Тексты кабинета родителя на языке сайта. */
export function useParentText(): ParentText {
  return TEXTS[useI18n().locale];
}
