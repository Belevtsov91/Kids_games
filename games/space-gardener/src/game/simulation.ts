import Matter from 'matter-js';
import { distanceToSegment, strokeLength, type Vec } from './ink';
import type { Level } from './levels';

// Физика уровня на matter-js. Без DOM: тот же код гоняют тесты в Node.

const { Bodies, Body, Composite, Engine, Events } = Matter;

export const WORLD_SIZE = 800;
export const STEP_MS = 1000 / 60;
export const DROP_R = 7;
export const LINE_W = 12;
export const WALL_W = 20;
export const PLANK_W = 16;
export const SPINNER_W = 14;
export const POT_H = 80;
export const POT_WALL = 14;
/** Предел скорости капли: меньше суммы радиуса капли и полутолщины линии, чтобы капли не пролетали сквозь линии. */
const MAX_SPEED = 10;
const EMIT_EVERY_MS = 75;
/** Радиус притяжения чёрной дыры в её радиусах и радиус, внутри которого капля исчезает. */
const HOLE_PULL = 3;
const HOLE_SWALLOW = 0.55;
const HOLE_FORCE = 0.00012;
/** Если капли замерли или долго не долетают, попытка заканчивается. */
const IDLE_STEPS = 100;
const AFTER_EMIT_LIMIT_MS = 20000;

export type Phase = 'edit' | 'pouring' | 'won' | 'lost';

export type SimEvent =
  | { type: 'emit'; x: number; y: number }
  | { type: 'splash'; x: number; y: number; speed: number }
  | { type: 'collect'; x: number; y: number; count: number }
  | { type: 'swallow'; x: number; y: number }
  | { type: 'stage'; stage: number }
  | { type: 'win' }
  | { type: 'lose' };

export interface Line {
  id: number;
  points: Vec[];
  length: number;
  bodies: Matter.Body[];
}

export interface Plank {
  body: Matter.Body;
  len: number;
}

export interface Spinner {
  body: Matter.Body;
  len: number;
  speed: number;
}

/** Детерминированный генератор: одинаковый seed — одинаковая попытка (для тестов). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const staticOptions = (label: string, friction = 0.05): Matter.IChamferableBodyDefinition => ({
  isStatic: true,
  label,
  friction,
  restitution: 0.1,
});

export class Simulation {
  readonly level: Level;
  readonly engine: Matter.Engine;
  readonly lines: Line[] = [];
  readonly planks: Plank[] = [];
  readonly spinners: Spinner[] = [];
  drops: Matter.Body[] = [];
  phase: Phase = 'edit';
  collected = 0;
  lost = 0;
  emitted = 0;
  /** Время с начала полива, мс. */
  time = 0;

  private readonly seed: number;
  private random: () => number;
  private nextLineId = 1;
  private emitTimer = 0;
  private idleSteps = 0;
  private emitDoneAt = -1;
  private stage = 0;
  private readonly listeners = new Set<(event: SimEvent) => void>();

  constructor(level: Level, seed = 1) {
    this.level = level;
    this.seed = seed;
    this.random = mulberry32(seed);
    this.engine = Engine.create({ positionIterations: 10, velocityIterations: 8 });
    this.engine.gravity.y = level.gravity ?? 1;
    this.buildLevel();
    Events.on(this.engine, 'collisionStart', (e) => this.onCollisions(e.pairs));
  }

  onEvent(listener: (event: SimEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get inkUsed() {
    return this.lines.reduce((sum, line) => sum + line.length, 0);
  }

  get inkLeft() {
    return Math.max(0, this.level.ink - this.inkUsed);
  }

  /** Доля собранной воды, 0..1. */
  get growth() {
    return Math.min(1, this.collected / this.level.need);
  }

  get canEdit() {
    return this.phase === 'edit' || this.phase === 'pouring';
  }

  /** Превращает штрих в лиану. Возвращает null, если линия слишком короткая или запас кончился. */
  addLine(points: readonly Vec[]): Line | null {
    if (points.length < 2) return null;
    const length = strokeLength(points);
    if (length < 6 || length > this.inkLeft + 0.5) return null;
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
    Composite.add(this.engine.world, bodies);
    const line: Line = { id: this.nextLineId++, points: points.map((p) => ({ ...p })), length, bodies };
    this.lines.push(line);
    return line;
  }

  /** Убирает последнюю лиану и возвращает её запас. */
  undo(): boolean {
    const line = this.lines.pop();
    if (!line) return false;
    Composite.remove(this.engine.world, line.bodies);
    return true;
  }

  startPour() {
    if (this.phase !== 'edit') return;
    this.phase = 'pouring';
  }

  /** Новая попытка: капли убираются, лианы и доски остаются на местах. */
  reset() {
    Composite.remove(this.engine.world, this.drops);
    this.drops = [];
    this.phase = 'edit';
    this.collected = 0;
    this.lost = 0;
    this.emitted = 0;
    this.time = 0;
    this.emitTimer = 0;
    this.idleSteps = 0;
    this.emitDoneAt = -1;
    this.stage = 0;
    this.random = mulberry32(this.seed);
  }

  /** Доска под точкой (с запасом для пальца). */
  plankAt(p: Vec, tolerance = 26): Plank | null {
    let best: Plank | null = null;
    let bestDistance = tolerance;
    for (const plank of this.planks) {
      const [a, b] = plankEnds(plank);
      const d = distanceToSegment(p, a, b);
      if (d < bestDistance) {
        best = plank;
        bestDistance = d;
      }
    }
    return best;
  }

  movePlank(plank: Plank, x: number, y: number) {
    const margin = 10;
    Body.setPosition(plank.body, {
      x: Math.max(margin, Math.min(WORLD_SIZE - margin, x)),
      y: Math.max(margin, Math.min(WORLD_SIZE - margin, y)),
    });
  }

  turnPlank(plank: Plank, delta: number) {
    Body.setAngle(plank.body, plank.body.angle + delta);
  }

  /** Один шаг физики, 1/60 секунды. */
  step() {
    for (const spinner of this.spinners) {
      const delta = (spinner.speed * STEP_MS) / 1000;
      Body.setAngle(spinner.body, spinner.body.angle + delta);
      Body.setAngularVelocity(spinner.body, delta);
    }
    if (this.phase === 'edit') return;

    this.time += STEP_MS;
    this.emit();
    Engine.update(this.engine, STEP_MS);
    this.updateDrops();
    this.checkEnd();
  }

  private emit() {
    const { emitter, drops } = this.level;
    if (this.emitted >= drops) return;
    this.emitTimer -= STEP_MS;
    if (this.emitTimer > 0) return;
    this.emitTimer = EMIT_EVERY_MS;
    const x = emitter.x + (this.random() - 0.5) * 10;
    const y = emitter.y + 34;
    const drop = Bodies.circle(x, y, DROP_R, {
      label: 'drop',
      restitution: 0.15,
      friction: 0.002,
      frictionStatic: 0,
      frictionAir: 0.012,
      density: 0.001,
    });
    Body.setVelocity(drop, { x: (this.random() - 0.5) * 0.6, y: 1 });
    Composite.add(this.engine.world, drop);
    this.drops.push(drop);
    this.emitted++;
    if (this.emitted === drops) this.emitDoneAt = this.time;
    this.fire({ type: 'emit', x, y });
  }

  private updateDrops() {
    const { pot, holes = [], need } = this.level;
    const potTop = pot.y - POT_H + 10;
    const kept: Matter.Body[] = [];
    let moving = false;

    for (const drop of this.drops) {
      const { x, y } = drop.position;
      if (Body.getSpeed(drop) > MAX_SPEED) Body.setSpeed(drop, MAX_SPEED);
      if (Body.getSpeed(drop) > 0.25) moving = true;

      let gone = false;
      for (const hole of holes) {
        const dx = hole.x - x;
        const dy = hole.y - y;
        const d = Math.hypot(dx, dy);
        if (d < hole.r * HOLE_SWALLOW) {
          gone = true;
          this.lost++;
          this.fire({ type: 'swallow', x, y });
          break;
        }
        const reach = hole.r * HOLE_PULL;
        if (d < reach) {
          const strength = HOLE_FORCE * drop.mass * (1 - d / reach) * 4;
          Body.applyForce(drop, drop.position, { x: (dx / d) * strength, y: (dy / d) * strength });
        }
      }

      if (!gone && x > pot.x - pot.w / 2 && x < pot.x + pot.w / 2 && y > potTop && y < pot.y + 4) {
        gone = true;
        this.collected++;
        this.fire({ type: 'collect', x, y, count: this.collected });
        const stage = Math.min(4, Math.floor((this.collected / need) * 4));
        if (stage > this.stage) {
          this.stage = stage;
          this.fire({ type: 'stage', stage });
        }
      }

      if (!gone && (y > WORLD_SIZE + 60 || x < -60 || x > WORLD_SIZE + 60)) {
        gone = true;
        this.lost++;
      }

      if (gone) Composite.remove(this.engine.world, drop);
      else kept.push(drop);
    }
    this.drops = kept;
    this.idleSteps = moving ? 0 : this.idleSteps + 1;
  }

  private checkEnd() {
    if (this.phase !== 'pouring') return;
    if (this.collected >= this.level.need) {
      this.phase = 'won';
      this.fire({ type: 'win' });
      return;
    }
    if (this.emitted < this.level.drops) return;
    const outOfDrops = this.drops.length === 0;
    const stuck = this.drops.length > 0 && this.idleSteps >= IDLE_STEPS;
    const tooLong = this.time - this.emitDoneAt > AFTER_EMIT_LIMIT_MS;
    if (outOfDrops || stuck || tooLong) {
      this.phase = 'lost';
      this.fire({ type: 'lose' });
    }
  }

  private onCollisions(pairs: Matter.Pair[]) {
    for (const { bodyA, bodyB } of pairs) {
      const drop = bodyA.label === 'drop' ? bodyA : bodyB.label === 'drop' ? bodyB : null;
      const other = drop === bodyA ? bodyB : bodyA;
      if (!drop || other.label === 'drop') continue;
      const speed = Body.getSpeed(drop);
      if (speed > 2.5) this.fire({ type: 'splash', x: drop.position.x, y: drop.position.y, speed });
    }
  }

  private fire(event: SimEvent) {
    for (const listener of this.listeners) listener(event);
  }

  private buildLevel() {
    const { level } = this;
    const bodies: Matter.Body[] = [];
    const { pot } = level;

    // Горшок: две стенки и дно; капли внутри засчитываются в updateDrops.
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
      this.planks.push({ body, len: p.len });
      bodies.push(body);
    }

    for (const s of level.spinners ?? []) {
      const body = Bodies.rectangle(s.x, s.y, s.len, SPINNER_W, {
        ...staticOptions('spinner'),
        chamfer: { radius: SPINNER_W / 2 - 1 },
      });
      this.spinners.push({ body, len: s.len, speed: s.speed });
      bodies.push(body);
    }

    Composite.add(this.engine.world, bodies);
  }
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

/** Ставит доски и рисует лианы из решения уровня (для подсказки и тестов). */
export function applySolution(sim: Simulation) {
  const { solution } = sim.level;
  solution.planks?.forEach((target, i) => {
    const plank = sim.planks[i];
    if (!plank) return;
    sim.movePlank(plank, target.x, target.y);
    Body.setAngle(plank.body, target.angle);
  });
  for (const line of solution.lines) sim.addLine(line);
}
