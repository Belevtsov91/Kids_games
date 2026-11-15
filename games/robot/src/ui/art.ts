// Рисунки — эмодзи и простые знаки: крупные, понятные малышам и одинаковые на всех языках.
import type { Cond, Kind } from '../game/program';

export const ROBOT = '🤖';
export const PARCEL = '📦';
export const TREE = '🌳';
export const WAVE = '🌊';
export const HEART = '💝';
export const FRIEND_ART: Record<string, string> = { bear: '🐻', bunny: '🐰', fox: '🦊', hedgehog: '🦔' };
export const CMD_ART: Record<Kind, string> = { fwd: '⬆', left: '↶', right: '↷', loop: '🔁', if: '❓' };
export const COND_ART: Record<Cond, string> = { wall: '🚧', free: '🟢' };
/** Число повторов на блоке: 0 — «пока не доставлю всё». */
export const timesArt = (n: number) => (n === 0 ? '∞' : `×${n}`);
