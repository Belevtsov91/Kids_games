// Перебор решений уровня: курс, мощность и (на орбитальных) момент торможения.
import { simulate } from '../src/game/flight';
import type { Level } from '../src/game/levels';

export interface Shot {
  angle: number;
  power: number;
  burnAt?: number;
  crystals: number;
}

export const solve = (level: Level, opts: { angleStep?: number; powerStep?: number; burnStep?: number; limit?: number } = {}): Shot[] => {
  const { angleStep = 2, powerStep = 4, burnStep = 0.25, limit = Infinity } = opts;
  const found: Shot[] = [];
  const burns = level.burns > 0 ? Array.from({ length: Math.floor(6 / burnStep) }, (_, i) => (i + 1) * burnStep) : [undefined];
  for (let angle = -60; angle <= 150; angle += angleStep) {
    for (let power = 10; power <= 100; power += powerStep) {
      for (const burnAt of burns) {
        const f = simulate(level, angle, power, burnAt);
        if (f.status === 'won') {
          found.push({ angle, power, burnAt, crystals: f.got.filter(Boolean).length });
          if (found.length >= limit) return found;
        }
      }
    }
  }
  return found;
};
