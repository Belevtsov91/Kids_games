// Уровни 1–5: по одной новой детали на уровень.
import type { Level } from './types';

const START_HIGH = { x: -5.6, y: 6, half: 1.1, angle: -0.12 };

export const FIRST: Level[] = [
  {
    id: 'ramp',
    ball: { x: -6.3, y: 6.5, vx: 0.5 },
    bulb: { x: 0.25, y: 2.15 },
    star: { x: -2.0, y: 3.75 },
    shelves: [START_HIGH],
    inventory: { ramp: 2 },
    par: 1,
    solution: [{ kind: 'ramp', col: 4, row: 3, variant: 1 }],
  },
  {
    id: 'spring',
    ball: { x: -6.3, y: 4.5, vx: 0.5 },
    bulb: { x: -1.25, y: 4.55 },
    star: { x: -2.3, y: 3.05 },
    shelves: [{ x: -5.6, y: 4, half: 1.1, angle: -0.12 }],
    inventory: { spring: 1, ramp: 1 },
    par: 1,
    solution: [{ kind: 'spring', col: 4, row: 0, variant: 0 }],
  },
  {
    id: 'lever',
    ball: { x: -6.3, y: 6.5, vx: 0.5 },
    bulb: { x: -0.5, y: 1.75 },
    star: { x: -1.7, y: 2.8 },
    shelves: [START_HIGH],
    inventory: { lever: 1 },
    par: 1,
    solution: [{ kind: 'lever', col: 4, row: 2, variant: 0 }],
  },
  {
    id: 'zigzag',
    ball: { x: 6.3, y: 7.5, vx: -0.5 },
    bulb: { x: -2.85, y: 1.6 },
    star: { x: -1.9, y: 2.35 },
    shelves: [{ x: 5.6, y: 7, half: 1.1, angle: 0.12 }],
    inventory: { ramp: 3 },
    par: 2,
    solution: [
      { kind: 'ramp', col: 9, row: 4, variant: 2 },
      { kind: 'ramp', col: 6, row: 2, variant: 2 },
    ],
  },
  {
    id: 'pendulum',
    ball: { x: -4.5, y: 4.4, vx: 0 },
    bulb: { x: 0.65, y: 3.1 },
    star: { x: -1.35, y: 4.3 },
    shelves: [{ x: -3, y: 4, half: 2, angle: 0 }],
    inventory: { pendulum: 1, ramp: 1 },
    par: 1,
    solution: [{ kind: 'pendulum', col: 2, row: 5, variant: 0 }],
  },
];
