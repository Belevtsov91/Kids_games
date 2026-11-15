// Физика полёта без DOM: закон всемирного тяготения a = μ / r², шаг «чехарда» (leapfrog),
// который честно держит орбиты — энергия не расползается, как у простого метода Эйлера.

export interface Vec {
  x: number;
  y: number;
}

/** Круговая орбита тела вокруг неподвижной точки: где оно в момент t. */
export interface Orbit {
  cx: number;
  cy: number;
  r: number;
  /** Период обращения в секундах; знак задаёт направление. */
  period: number;
  /** Начальный угол, радианы. */
  phase: number;
}

export type BodyKind = 'home' | 'planet' | 'target' | 'sun';

export interface Body {
  kind: BodyKind;
  x: number;
  y: number;
  r: number;
  /** Гравитационный параметр μ = G·M: чем больше, тем сильнее тянет. */
  mu: number;
  color: string;
  ring?: boolean;
  orbit?: Orbit;
}

export interface Ship {
  pos: Vec;
  vel: Vec;
}

/** Мир полёта — сцена размером WORLD.w × WORLD.h условных единиц. */
export const WORLD = { w: 1000, h: 625 };
/** Шаг интегрирования, секунды. */
export const DT = 1 / 240;
/** Скорость ракеты при мощности 100 %, единиц в секунду. */
export const MAX_SPEED = 420;

/** Положение тела в момент t (у неподвижных — их x, y). */
export const bodyAt = (b: Body, t: number): Vec => {
  if (!b.orbit) return { x: b.x, y: b.y };
  const a = b.orbit.phase + (2 * Math.PI * t) / b.orbit.period;
  return { x: b.orbit.cx + b.orbit.r * Math.cos(a), y: b.orbit.cy + b.orbit.r * Math.sin(a) };
};

/** Ускорение ракеты от всех тел в момент t. Смягчение не даёт бесконечности у самой поверхности. */
export const accelAt = (p: Vec, bodies: readonly Body[], t: number): Vec => {
  let ax = 0;
  let ay = 0;
  for (const b of bodies) {
    const c = bodyAt(b, t);
    const dx = c.x - p.x;
    const dy = c.y - p.y;
    const d2 = Math.max(dx * dx + dy * dy, b.r * b.r);
    const k = b.mu / (d2 * Math.sqrt(d2));
    ax += dx * k;
    ay += dy * k;
  }
  return { x: ax, y: ay };
};

/** Один шаг «толчок–сдвиг–толчок». Возвращает новую ракету, старую не меняет. */
export const step = (s: Ship, bodies: readonly Body[], t: number, dt = DT): Ship => {
  const a0 = accelAt(s.pos, bodies, t);
  const vx = s.vel.x + a0.x * dt * 0.5;
  const vy = s.vel.y + a0.y * dt * 0.5;
  const pos = { x: s.pos.x + vx * dt, y: s.pos.y + vy * dt };
  const a1 = accelAt(pos, bodies, t + dt);
  return { pos, vel: { x: vx + a1.x * dt * 0.5, y: vy + a1.y * dt * 0.5 } };
};

/** Скорость круговой орбиты на расстоянии r от тела с параметром μ: v = √(μ / r). */
export const circularSpeed = (mu: number, r: number) => Math.sqrt(mu / r);

/** Угол в градусах (0 — вправо, 90 — вверх) → единичный вектор в экранных координатах (y вниз). */
export const dirOf = (deg: number): Vec => {
  const a = (deg * Math.PI) / 180;
  return { x: Math.cos(a), y: -Math.sin(a) };
};

/** Ракета на старте: у поверхности родной планеты, нос по курсу, скорость по мощности (0–100). */
export const launchShip = (home: Body, angle: number, power: number): Ship => {
  const d = dirOf(angle);
  const gap = home.r + 10;
  const speed = (MAX_SPEED * Math.min(100, Math.max(0, power))) / 100;
  return { pos: { x: home.x + d.x * gap, y: home.y + d.y * gap }, vel: { x: d.x * speed, y: d.y * speed } };
};

export const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
