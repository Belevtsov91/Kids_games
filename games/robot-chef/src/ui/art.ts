// Рисунки — эмодзи: крупные, понятные малышам и одинаковые на всех языках.
import type { Dir } from '../game/grid';

export const ROBOT = '🤖';
export const POT = '🍲';
export const CRATE = '📦';
export const ARROW: Record<Dir, string> = { up: '⬆️', down: '⬇️', left: '⬅️', right: '➡️' };
export const FOOD_ART: Record<string, string> = {
  carrot: '🥕', tomato: '🍅', mushroom: '🍄', egg: '🥚', onion: '🧅', potato: '🥔', corn: '🌽', cheese: '🧀',
};
