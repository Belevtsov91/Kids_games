import Matter from 'matter-js';
import type { Simulation } from './Simulation';

/** Ставит доски и рисует лианы из решения уровня (для подсказки и тестов). */
export function applySolution(sim: Simulation) {
  const { solution } = sim.level;
  solution.planks?.forEach((target, i) => {
    const plank = sim.planks[i];
    if (!plank) return;
    sim.movePlank(plank, target.x, target.y);
    Matter.Body.setAngle(plank.body, target.angle);
  });
  for (const line of solution.lines) sim.addLine(line);
}
