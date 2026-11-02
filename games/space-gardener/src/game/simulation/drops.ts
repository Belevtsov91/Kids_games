import Matter from 'matter-js';
import type { Level } from '../levels';
import type { SimEvent } from './types';
import { HOLE_FORCE, HOLE_PULL, HOLE_SWALLOW, MAX_SPEED, POT_H, WORLD_SIZE } from './constants';

// Что происходит с одной каплей за шаг: ограничение скорости, притяжение чёрных дыр и куда она делась.

const { Body } = Matter;

/** swallowed — съела чёрная дыра, collected — попала в горшок, lost — улетела за край, null — летит дальше. */
export type DropFate = 'swallowed' | 'collected' | 'lost' | null;

export function stepDrop(drop: Matter.Body, level: Level): DropFate {
  const { pot, holes = [] } = level;
  const { x, y } = drop.position;
  if (Body.getSpeed(drop) > MAX_SPEED) Body.setSpeed(drop, MAX_SPEED);

  for (const hole of holes) {
    const dx = hole.x - x;
    const dy = hole.y - y;
    const d = Math.hypot(dx, dy);
    if (d < hole.r * HOLE_SWALLOW) return 'swallowed';
    const reach = hole.r * HOLE_PULL;
    if (d < reach) {
      const strength = HOLE_FORCE * drop.mass * (1 - d / reach) * 4;
      Body.applyForce(drop, drop.position, { x: (dx / d) * strength, y: (dy / d) * strength });
    }
  }

  const potTop = pot.y - POT_H + 10;
  if (x > pot.x - pot.w / 2 && x < pot.x + pot.w / 2 && y > potTop && y < pot.y + 4) return 'collected';
  if (y > WORLD_SIZE + 60 || x < -60 || x > WORLD_SIZE + 60) return 'lost';
  return null;
}

/** Всплески: капля быстро ударилась обо что-то, кроме другой капли. */
export function splashEvents(pairs: Matter.Pair[]): SimEvent[] {
  const events: SimEvent[] = [];
  for (const { bodyA, bodyB } of pairs) {
    const drop = bodyA.label === 'drop' ? bodyA : bodyB.label === 'drop' ? bodyB : null;
    const other = drop === bodyA ? bodyB : bodyA;
    if (!drop || other.label === 'drop') continue;
    const speed = Body.getSpeed(drop);
    if (speed > 2.5) events.push({ type: 'splash', x: drop.position.x, y: drop.position.y, speed });
  }
  return events;
}
