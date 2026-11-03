// Кто и что живёт в долине: жители, кристаллы, сундуки, слаймы, олени и камни у поляны босса.
// Только координаты; поведение — в scene/characters/.

import type { NpcId } from '../quests';
import { BOSS_CLEARING, type Vec2 } from './map';

export interface NpcSpot {
  id: NpcId;
  model: string;
  at: Vec2;
  rot: number;
}
export const NPCS: NpcSpot[] = [
  { id: 'granny', model: 'npc-granny', at: [-7, -5], rot: 0.9 },
  { id: 'miller', model: 'npc-miller', at: [24.5, -13.5], rot: -2.4 },
  { id: 'ranger', model: 'npc-ranger', at: [-9, -14], rot: 0.6 },
];

export const CRYSTALS: Vec2[] = [
  [-13, -4],
  [-27, 0],
  [-24, 16],
  [-4, 22],
  [6, 25],
  [33, 6],
  [14, -20],
  [-17, -24],
  [-30, -13],
  [3, -22],
  [-12, 27],
  [30, -6],
];

export const CHESTS: { id: string; at: Vec2; rot: number }[] = [
  { id: 'lake', at: [-31, 12], rot: 1.2 },
  { id: 'stable', at: [32, 20], rot: -2.2 },
  { id: 'forest', at: [-24, -30], rot: 0.5 },
];

export interface SlimeSpawn {
  id: string;
  at: Vec2;
  kind: 'slime' | 'slime-pink' | 'imp';
}
export const SLIMES: SlimeSpawn[] = [
  { id: 's1', at: [-14, -12], kind: 'slime' },
  { id: 's2', at: [-20, -16], kind: 'slime-pink' },
  { id: 's3', at: [-26, -8], kind: 'slime' },
  { id: 's4', at: [-16, -22], kind: 'imp' },
  { id: 's5', at: [-28, -22], kind: 'slime-pink' },
  { id: 's6', at: [-8, -24], kind: 'slime' },
  { id: 's7', at: [-30, 4], kind: 'imp' },
  { id: 's8', at: [10, -26], kind: 'slime' },
  { id: 's9', at: [-6, 26], kind: 'slime-pink' },
];

export const DEER: Vec2[] = [
  [-26, 18],
  [-10, 12],
];

/** Крупные камни-ориентиры вокруг поляны Грибного короля. */
export const OBELISKS: Vec2[] = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2;
  return [BOSS_CLEARING[0] + Math.cos(a) * 6.5, BOSS_CLEARING[1] + Math.sin(a) * 6.5];
});
