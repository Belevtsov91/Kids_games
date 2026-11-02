import type Matter from 'matter-js';
import type { Vec } from '../ink';

export type Phase = 'edit' | 'pouring' | 'won' | 'lost';

export type SimEvent =
  | { type: 'emit'; x: number; y: number }
  | { type: 'splash'; x: number; y: number; speed: number }
  | { type: 'collect'; x: number; y: number; count: number }
  | { type: 'swallow'; x: number; y: number }
  | { type: 'stage'; stage: number }
  | { type: 'win' }
  | { type: 'lose' };

export interface Line {
  id: number;
  points: Vec[];
  length: number;
  bodies: Matter.Body[];
}

export interface Plank {
  body: Matter.Body;
  len: number;
}

export interface Spinner {
  body: Matter.Body;
  len: number;
  speed: number;
}
