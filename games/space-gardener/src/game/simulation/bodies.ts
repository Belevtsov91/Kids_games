import Matter from 'matter-js';
import type { Vec } from '../ink';
import type { Level } from '../levels';
import { DROP_R, LINE_W, PLANK_W, POT_H, POT_WALL, SPINNER_W, WALL_W } from './constants';
import type { Plank, Spinner } from './types';

// Фабрики физических тел: стенки уровня, лианы игрока и капли.

const { Bodies } = Matter;

const staticOptions = (label: string, friction = 0.05): Matter.IChamferableBodyDefinition => ({
  isStatic: true,
  label,
  friction,
  restitution: 0.1,
});

/** Всё неподвижное и подвижное из описания уровня: горшок, астероиды, стены, доски, вертушки. */
export function createLevelBodies(level: Level) {
  const bodies: Matter.Body[] = [];
  const planks: Plank[] = [];
  const spinners: Spinner[] = [];
  const { pot } = level;

  // Горшок: две стенки и дно; капли внутри засчитываются при обновлении капель.
  const wallY = pot.y - POT_H / 2;
  bodies.push(
    Bodies.rectangle(pot.x - pot.w / 2 - POT_WALL / 2, wallY, POT_WALL, POT_H, staticOptions('pot')),
    Bodies.rectangle(pot.x + pot.w / 2 + POT_WALL / 2, wallY, POT_WALL, POT_H, staticOptions('pot')),
    Bodies.rectangle(pot.x, pot.y + POT_WALL / 2, pot.w + POT_WALL * 2, POT_WALL, staticOptions('pot')),
  );

  for (const a of level.asteroids ?? []) bodies.push(Bodies.circle(a.x, a.y, a.r, staticOptions('asteroid', 0.1)));

  for (const w of level.walls ?? []) {
    const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
    bodies.push(
      Bodies.rectangle((w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2, len + WALL_W, WALL_W, {
        ...staticOptions('wall'),
        angle: Math.atan2(w.y2 - w.y1, w.x2 - w.x1),
        chamfer: { radius: WALL_W / 2 - 1 },
      }),
    );
  }

  for (const p of level.planks ?? []) {
    const body = Bodies.rectangle(p.x, p.y, p.len, PLANK_W, {
      ...staticOptions('plank', 0.03),
      angle: p.angle,
      chamfer: { radius: PLANK_W / 2 - 1 },
    });
    planks.push({ body, len: p.len });
    bodies.push(body);
  }

  for (const s of level.spinners ?? []) {
    const body = Bodies.rectangle(s.x, s.y, s.len, SPINNER_W, {
      ...staticOptions('spinner'),
      chamfer: { radius: SPINNER_W / 2 - 1 },
    });
    spinners.push({ body, len: s.len, speed: s.speed });
    bodies.push(body);
  }

  return { bodies, planks, spinners };
}

/** Лиана из штриха: круг в каждой точке и прямоугольник на каждом отрезке. */
export function createLineBodies(points: readonly Vec[]): Matter.Body[] {
  const bodies: Matter.Body[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    bodies.push(Bodies.circle(p.x, p.y, LINE_W / 2, staticOptions('line')));
    if (i === 0) continue;
    const a = points[i - 1];
    const len = Math.hypot(p.x - a.x, p.y - a.y);
    if (len < 0.5) continue;
    bodies.push(
      Bodies.rectangle((a.x + p.x) / 2, (a.y + p.y) / 2, len, LINE_W, {
        ...staticOptions('line'),
        angle: Math.atan2(p.y - a.y, p.x - a.x),
      }),
    );
  }
  return bodies;
}

/** Капля из лейки: чуть в стороне от центра и с небольшим случайным толчком. */
export function createDrop(emitter: Vec, random: () => number): Matter.Body {
  const x = emitter.x + (random() - 0.5) * 10;
  const y = emitter.y + 34;
  const drop = Bodies.circle(x, y, DROP_R, {
    label: 'drop',
    restitution: 0.15,
    friction: 0.002,
    frictionStatic: 0,
    frictionAir: 0.012,
    density: 0.001,
  });
  Matter.Body.setVelocity(drop, { x: (random() - 0.5) * 0.6, y: 1 });
  return drop;
}

/** Концы доски в мировых координатах. */
export function plankEnds(plank: Plank): [Vec, Vec] {
  const { position, angle } = plank.body;
  const dx = (Math.cos(angle) * plank.len) / 2;
  const dy = (Math.sin(angle) * plank.len) / 2;
  return [
    { x: position.x - dx, y: position.y - dy },
    { x: position.x + dx, y: position.y + dy },
  ];
}
