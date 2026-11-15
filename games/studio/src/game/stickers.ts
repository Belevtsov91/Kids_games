import { noteCount, rowsUsed, type Groove } from './pattern';

// Когда какие наклейки выдавать. Список наклеек — в manifest.ts, тут только правила.

export const STICKERS = {
  firstBeat: 'first-beat',
  fullBand: 'full-band',
  speedy: 'speedy',
  myBeat: 'my-beat',
  forParents: 'for-parents',
} as const;

/** Наклейки за запущенный ритм. */
export function playStickers(groove: Groove): string[] {
  const out: string[] = [];
  const notes = noteCount(groove.pattern);
  if (notes >= 4) out.push(STICKERS.firstBeat);
  if (rowsUsed(groove.pattern) === 4) out.push(STICKERS.fullBand);
  if (notes >= 4 && groove.bpm >= 150) out.push(STICKERS.speedy);
  return out;
}
