import Matter from 'matter-js';
import { distanceToSegment, type Vec } from '../ink';
import { plankEnds } from './bodies';
import { STEP_MS, WORLD_SIZE } from './constants';
import type { Plank, Spinner } from './types';

// Подвижные части уровня: доски, которые двигает ребёнок, и вертушки, которые крутятся сами.

const { Body } = Matter;
const MARGIN = 10;

/** Ближайшая доска под точкой (с запасом для пальца). */
export function findPlankAt(planks: readonly Plank[], p: Vec, tolerance: number): Plank | null {
  let best: Plank | null = null;
  let bestDistance = tolerance;
  for (const plank of planks) {
    const [a, b] = plankEnds(plank);
    const d = distanceToSegment(p, a, b);
    if (d < bestDistance) {
      best = plank;
      bestDistance = d;
    }
  }
  return best;
}

/** Двигает доску, не выпуская её за край мира. */
export function movePlankTo(plank: Plank, x: number, y: number) {
  Body.setPosition(plank.body, {
    x: Math.max(MARGIN, Math.min(WORLD_SIZE - MARGIN, x)),
    y: Math.max(MARGIN, Math.min(WORLD_SIZE - MARGIN, y)),
  });
}

export function turnPlankBy(plank: Plank, delta: number) {
  Body.setAngle(plank.body, plank.body.angle + delta);
}

/** Поворачивает вертушки на один шаг физики. */
export function spinAll(spinners: readonly Spinner[]) {
  for (const spinner of spinners) {
    const delta = (spinner.speed * STEP_MS) / 1000;
    Body.setAngle(spinner.body, spinner.body.angle + delta);
    Body.setAngularVelocity(spinner.body, delta);
  }
}
