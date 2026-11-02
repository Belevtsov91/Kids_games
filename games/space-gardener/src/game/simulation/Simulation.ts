import Matter from 'matter-js';
import { strokeLength, type Vec } from '../ink';
import type { Level } from '../levels';
import { createDrop, createLevelBodies, createLineBodies } from './bodies';
import { EMIT_EVERY_MS, STEP_MS } from './constants';
import { splashEvents, stepDrop } from './drops';
import { pourOutcome } from './outcome';
import { findPlankAt, movePlankTo, spinAll, turnPlankBy } from './movables';
import { mulberry32 } from './random';
import type { Line, Phase, Plank, SimEvent, Spinner } from './types';

// Одна попытка уровня: лианы игрока, доски, капли и подсчёт результата.

const { Body, Composite, Engine, Events } = Matter;

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
    const { bodies, planks, spinners } = createLevelBodies(level);
    this.planks.push(...planks);
    this.spinners.push(...spinners);
    Composite.add(this.engine.world, bodies);
    Events.on(this.engine, 'collisionStart', (e) => splashEvents(e.pairs).forEach((event) => this.fire(event)));
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
    const bodies = createLineBodies(points);
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
    this.collected = this.lost = this.emitted = this.time = 0;
    this.emitTimer = this.idleSteps = this.stage = 0;
    this.emitDoneAt = -1;
    this.random = mulberry32(this.seed);
  }

  /** Доска под точкой (с запасом для пальца). */
  plankAt(p: Vec, tolerance = 26): Plank | null {
    return findPlankAt(this.planks, p, tolerance);
  }

  movePlank(plank: Plank, x: number, y: number) {
    movePlankTo(plank, x, y);
  }

  turnPlank(plank: Plank, delta: number) {
    turnPlankBy(plank, delta);
  }

  /** Один шаг физики, 1/60 секунды. */
  step() {
    spinAll(this.spinners);
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
    const drop = createDrop(emitter, this.random);
    const { x, y } = drop.position;
    Composite.add(this.engine.world, drop);
    this.drops.push(drop);
    this.emitted++;
    if (this.emitted === drops) this.emitDoneAt = this.time;
    this.fire({ type: 'emit', x, y });
  }

  private updateDrops() {
    const kept: Matter.Body[] = [];
    let moving = false;
    for (const drop of this.drops) {
      const { x, y } = drop.position;
      const fate = stepDrop(drop, this.level);
      if (Body.getSpeed(drop) > 0.25) moving = true;
      if (fate === 'swallowed') {
        this.lost++;
        this.fire({ type: 'swallow', x, y });
      } else if (fate === 'collected') this.collect(x, y);
      else if (fate === 'lost') this.lost++;

      if (fate) Composite.remove(this.engine.world, drop);
      else kept.push(drop);
    }
    this.drops = kept;
    this.idleSteps = moving ? 0 : this.idleSteps + 1;
  }

  private collect(x: number, y: number) {
    this.collected++;
    this.fire({ type: 'collect', x, y, count: this.collected });
    const stage = Math.min(4, Math.floor((this.collected / this.level.need) * 4));
    if (stage > this.stage) {
      this.stage = stage;
      this.fire({ type: 'stage', stage });
    }
  }

  private checkEnd() {
    if (this.phase !== 'pouring') return;
    const { need, drops } = this.level;
    const outcome = pourOutcome({
      collected: this.collected,
      need,
      emitted: this.emitted,
      totalDrops: drops,
      dropsInAir: this.drops.length,
      idleSteps: this.idleSteps,
      sinceLastEmit: this.time - this.emitDoneAt,
    });
    if (!outcome) return;
    this.phase = outcome;
    this.fire({ type: outcome === 'won' ? 'win' : 'lose' });
  }

  private fire(event: SimEvent) {
    for (const listener of this.listeners) listener(event);
  }
}
