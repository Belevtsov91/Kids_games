// Типы, которыми сцена обменивается с приложением.
import type { Cell } from '../game/world';

export type Vec3 = [number, number, number];

export type TapTarget =
  | { kind: 'block'; cell: Cell; normal: Cell; point: Vec3 }
  | { kind: 'tree'; cell: Cell; point: Vec3 }
  | { kind: 'seabed'; point: Vec3 }
  | { kind: 'water'; point: Vec3 };

export interface Floater {
  id: number;
  kind: 'boat' | 'crate';
  pos: Vec3;
  rot: number;
  color: string;
}

export interface Effect {
  id: number;
  pos: Vec3;
  color: string;
}
