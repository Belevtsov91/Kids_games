import type { Locale } from '@ig/sdk';
import type { ShowcaseCopy, ShowcaseId } from '../showcase';
import { en } from './en';
import { ro } from './ro';
import { ru } from './ru';
import { uk } from './uk';

/** Тексты витрины по языкам. */
export const SHOWCASE_TEXT: Record<Locale, Record<ShowcaseId, ShowcaseCopy>> = { ru, uk, ro, en };
