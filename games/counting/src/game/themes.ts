// Темы приключения, значки режимов и длина сессии.

export const THEMES = [
  { id: 'farm', pet: '🐰', item: '🥕', accent: '#ed9146' },
  { id: 'forest', pet: '🐿️', item: '🌰', accent: '#4c9271' },
  { id: 'sea', pet: '🐬', item: '🐟', accent: '#508ed0' },
] as const;

export type Theme = (typeof THEMES)[number];

/** Значки режимов в том же порядке, что и `modes`. */
export const MODE_ICONS = ['🖐️', '🥕', '🔢', '🔍', '⚖️', '✨'];

/** Заданий в одной сессии. */
export const ROUNDS = 5;

export const LIMITS = [5, 10, 20];
