// Уровни 6–10: стенка, шестерёнка и машины из нескольких деталей.
import type { Level } from './types';

const FLAT_START = { x: -3, y: 4, half: 2, angle: 0 };

export const SECOND: Level[] = [
  {
    id: 'wall',
    ball: { x: -6.6, y: 4.8, vx: 0 },
    bulb: { x: 2.6, y: 1.5 },
    star: { x: 2.7, y: 2.55 },
    shelves: [
      { x: -2, y: 3, half: 4, angle: 0 },
      { x: -6.3, y: 4.2, half: 0.8, angle: -0.5 },
    ],
    inventory: { block: 2, ramp: 1 },
    par: 1,
    solution: [{ kind: 'block', col: 10, row: 2, variant: 0 }],
  },
  {
    id: 'gear',
    ball: { x: -6.3, y: 3.5, vx: 0.5 },
    bulb: { x: -5.0, y: 1.25 },
    star: { x: -4.2, y: 2.4 },
    shelves: [{ x: -5.6, y: 3, half: 1.1, angle: -0.12 }],
    inventory: { gear: 1, ramp: 1 },
    par: 1,
    solution: [{ kind: 'gear', col: 3, row: 1, variant: 1 }],
  },
  {
    id: 'jump',
    ball: { x: 6.3, y: 6.5, vx: -0.5 },
    bulb: { x: 0.25, y: 6.65 },
    star: { x: 1.65, y: 5.0 },
    shelves: [{ x: 5.6, y: 6, half: 1.1, angle: 0.12 }],
    inventory: { spring: 1, ramp: 2 },
    par: 1,
    solution: [{ kind: 'spring', col: 9, row: 0, variant: 0 }],
  },
  {
    id: 'knock',
    ball: { x: -4.5, y: 4.4, vx: 0 },
    bulb: { x: -0.5, y: 1.3 },
    star: { x: 1.1, y: 2.4 },
    shelves: [FLAT_START],
    inventory: { pendulum: 1, ramp: 2 },
    par: 2,
    solution: [
      { kind: 'pendulum', col: 2, row: 5, variant: 0 },
      { kind: 'ramp', col: 7, row: 1, variant: 3 },
    ],
  },
  {
    id: 'boomerang',
    ball: { x: -4.5, y: 4.4, vx: 0 },
    bulb: { x: -1.6, y: 5.05 },
    star: { x: 0.55, y: 3.05 },
    shelves: [FLAT_START],
    fixed: [{ kind: 'pendulum', col: 2, row: 5, variant: 0 }],
    inventory: { spring: 1, ramp: 1 },
    par: 1,
    solution: [{ kind: 'spring', col: 9, row: 0, variant: 1 }],
  },
];
