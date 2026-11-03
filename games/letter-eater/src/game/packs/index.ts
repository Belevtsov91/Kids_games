import type { Locale } from '@ig/sdk';
import { en } from './en';
import { ro } from './ro';
import { ru } from './ru';
import type { LanguagePack } from './types';
import { uk } from './uk';

/** Буквы и слова по языкам: на каждом языке свой алфавит и свои слова. */
export const PACKS: Record<Locale, LanguagePack> = { ru, uk, ro, en };
export type { LanguagePack, Word } from './types';
