// Прогон машины: шаг физики и судья «лампа зажглась / шарик потерялся».
import type { Level } from '../game/levels/types';
import { SIZE, type Placed } from '../game/parts';
import { buildWorld, zQuat, type LabWorld, type Rapier } from './world';

export type Outcome = 'running' | 'lit' | 'lost';

export const STEP = 1 / 60;
const MAX_TIME = 16;
const STILL_TIME = 1.6;

export interface Run {
  lab: LabWorld;
  time: number;
  outcome: Outcome;
  /** Шарик пролетел через звёздочку. */
  star: boolean;
  /** Сколько подряд шарик почти не двигается. */
  still: number;
  /** Сколько раз шарик стукнулся о детали: для звука «тук». */
  hits: number;
}

export function startRun(R: Rapier, level: Level, machine: Placed[]): Run {
  return { lab: buildWorld(R, level, machine), time: 0, outcome: 'running', star: false, still: 0, hits: 0 };
}

const near = (p: { x: number; y: number }, q: { x: number; y: number }, r: number) => Math.hypot(p.x - q.x, p.y - q.y) < r;

/** Один шаг 1/60 с. Возвращает исход после шага. */
export function step(run: Run, level: Level): Outcome {
  if (run.outcome !== 'running') return run.outcome;
  const { world, ball, movers } = run.lab;
  for (const m of movers) {
    if (m.spin === undefined) continue;
    m.body.setNextKinematicRotation(zQuat(m.spin * (run.time + STEP)));
  }
  const before = ball.linvel();
  world.step();
  run.time += STEP;
  const p = ball.translation();
  const v = ball.linvel();
  if (Math.abs(v.x - before.x) + Math.abs(v.y - before.y - world.gravity.y * STEP) > 1.5) run.hits++;
  if (near(p, level.star, SIZE.star + SIZE.ball)) run.star = true;
  run.still = Math.hypot(v.x, v.y) < 0.06 ? run.still + STEP : 0;
  if (near(p, level.bulb, SIZE.bulb + SIZE.ball)) run.outcome = 'lit';
  else if (p.y < -2 || Math.abs(p.x) > 10 || run.time > MAX_TIME || (run.time > 2.5 && run.still > STILL_TIME)) run.outcome = 'lost';
  return run.outcome;
}

/** Прогон до конца без отрисовки: для тестов и проверки уровней. */
export function simulate(R: Rapier, level: Level, machine: Placed[]) {
  const run = startRun(R, level, machine);
  while (step(run, level) === 'running');
  const result = { outcome: run.outcome, star: run.star, time: run.time };
  run.lab.world.free();
  return result;
}
