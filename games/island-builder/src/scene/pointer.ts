// Помощники для нажатий по сцене.
import type { ThreeEvent } from '@react-three/fiber';
import type { Vector3 } from 'three';
import type { Cell } from '../game/world';
import type { Vec3 } from './types';

/** Нажатие, а не поворот камеры: палец почти не сдвинулся. */
export const isTap = (e: ThreeEvent<MouseEvent>) => e.delta < 8;
export const toVec = (v: Vector3): Vec3 => [v.x, v.y, v.z];
export const add = (a: Cell, b: Cell): Cell => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const seabedCell = (p: Vec3): Cell => ({ x: Math.floor(p[0] + 10), y: 0, z: Math.floor(p[2] + 10) });
