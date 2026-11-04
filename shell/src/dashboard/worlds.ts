import type { GameManifest } from '@ig/sdk';
import type { Locale } from '@/i18n/locale';

// Цвет свечения портала и короткая фраза под названием игры на дашборде.
// Всё берётся из манифеста игры (color, tagline/taglines): оболочка не знает игры по именам.

const FALLBACK = '#ffd25a';

export const worldColor = (game: GameManifest) => game.color ?? FALLBACK;
export const worldText = (game: GameManifest, locale: Locale) => game.taglines?.[locale] ?? game.tagline ?? '';
