import type { Locale } from '../locale';
import { en } from './en';
import { ro } from './ro';
import { ru, type Dict } from './ru';
import { uk } from './uk';

export type { Dict };

export const DICTS: Record<Locale, Dict> = { ru, uk, ro, en };
