// Полёт ракеты по уровню: шаги физики, кристаллы, столкновения, цель «сесть» или «облететь по орбите».
import type { Level } from './levels';
import { bodyAt, dist, DT, launchShip, step, WORLD, type BodyKind, type Ship, type Vec } from './physics';

export type FlightStatus = 'flying' | 'won' | 'crashed' | 'fell' | 'burned' | 'lost';
export type FlightEvent = 'crystal' | Exclude<FlightStatus, 'flying'>;

export interface Flight {
  ship: Ship;
  t: number;
  /** Пройденный путь (точка на каждые 1/30 секунды) — рисуем как след. */
  trail: Vec[];
  /** Сколько радиан ракета облетела вокруг цели подряд (для цели «орбита»). */
  swept: number;
  lastAngle: number | null;
  got: boolean[];
  /** Сколько раз ещё можно включить тормозной двигатель. */
  burns: number;
  status: FlightStatus;
}

/** Игровое время идёт медленнее настоящего, а у цели с неистраченным тормозом — совсем замедленно. */
export const TIME_SCALE = 0.65;
const SLOW_MO = 0.3;
/** Ракете ближе этого к кристаллу — подобрала. */
export const PICK_RADIUS = 18;
/** Вылет дальше этого за край — потерялась в космосе. */
const MARGIN = 220;
const TRAIL_EVERY = 8;

export const captureRadius = (level: Level) => target(level).r * 5;
export const target = (level: Level) => level.bodies.find((b) => b.kind === 'target')!;
export const home = (level: Level) => level.bodies.find((b) => b.kind === 'home')!;

export const startFlight = (level: Level, angle: number, power: number): Flight => {
  const ship = launchShip(home(level), angle, power);
  return { ship, t: 0, trail: [ship.pos], swept: 0, lastAngle: null, got: level.crystals.map(() => false), burns: level.burns, status: 'flying' };
};

const crashStatus = (kind: BodyKind): FlightStatus => (kind === 'sun' ? 'burned' : kind === 'home' ? 'fell' : 'crashed');

/** Один шаг физики со всеми проверками. Меняет полёт на месте и пишет события. */
const tick = (f: Flight, level: Level, events: FlightEvent[]) => {
  f.ship = step(f.ship, level.bodies, f.t);
  f.t += DT;
  const p = f.ship.pos;
  if (Math.round(f.t / DT) % TRAIL_EVERY === 0) f.trail.push(p);

  level.crystals.forEach((c, i) => {
    if (!f.got[i] && dist(p, c) < PICK_RADIUS) {
      f.got[i] = true;
      events.push('crystal');
    }
  });

  for (const b of level.bodies) {
    if (dist(p, bodyAt(b, f.t)) > b.r) continue;
    f.status = b.kind === 'target' && level.goal === 'land' ? 'won' : crashStatus(b.kind);
    return;
  }

  if (level.goal === 'orbit') {
    const c = bodyAt(target(level), f.t);
    if (dist(p, c) < captureRadius(level)) {
      const a = Math.atan2(p.y - c.y, p.x - c.x);
      if (f.lastAngle !== null) {
        let d = a - f.lastAngle;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        f.swept += d;
      }
      f.lastAngle = a;
      if (Math.abs(f.swept) >= 2 * Math.PI) f.status = 'won';
    } else {
      f.swept = 0;
      f.lastAngle = null;
    }
  }

  const out = p.x < -MARGIN || p.y < -MARGIN || p.x > WORLD.w + MARGIN || p.y > WORLD.h + MARGIN;
  if (out || f.t > level.maxTime) f.status = 'lost';
};

/** Продвинуть полёт на seconds секунд игрового времени. */
export const advance = (f: Flight, level: Level, seconds: number): FlightEvent[] => {
  const events: FlightEvent[] = [];
  const steps = Math.max(1, Math.round(seconds / DT));
  for (let i = 0; i < steps && f.status === 'flying'; i++) tick(f, level, events);
  if (f.status !== 'flying') events.push(f.status);
  return events;
};

/** Тормозной импульс: скорость падает до BRAKE от прежней. Так настоящие корабли выходят на орбиту. */
export const BRAKE = 0.55;

export const burn = (f: Flight): boolean => {
  if (f.status !== 'flying' || f.burns <= 0) return false;
  f.burns -= 1;
  f.ship = { pos: f.ship.pos, vel: { x: f.ship.vel.x * BRAKE, y: f.ship.vel.y * BRAKE } };
  return true;
};

/** Во сколько раз игровое время медленнее настоящего сейчас: у цели замедляем, чтобы успеть затормозить. */
export const timeScale = (f: Flight, level: Level) =>
  f.burns > 0 && dist(f.ship.pos, bodyAt(target(level), f.t)) < captureRadius(level) ? SLOW_MO : TIME_SCALE;

/** Пунктир-подсказка: первые level.preview секунд будущего пути. */
export const previewPath = (level: Level, angle: number, power: number): Vec[] => {
  const f = startFlight(level, angle, power);
  const points: Vec[] = [];
  const steps = Math.round(level.preview / DT);
  for (let i = 1; i <= steps && f.status === 'flying'; i++) {
    tick(f, level, []);
    if (i % 12 === 0) points.push(f.ship.pos);
  }
  return points;
};

/** Прогнать полёт до конца (для проверки уровней и тестов); burnAt — когда тормозить, секунды. */
export const simulate = (level: Level, angle: number, power: number, burnAt?: number): Flight => {
  const f = startFlight(level, angle, power);
  if (burnAt !== undefined) {
    advance(f, level, burnAt);
    burn(f);
  }
  while (f.status === 'flying') advance(f, level, 1);
  return f;
};
