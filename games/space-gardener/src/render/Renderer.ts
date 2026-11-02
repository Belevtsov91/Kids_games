import type { Vec } from '../game/ink';
import { WORLD_SIZE } from '../game/simulation';
import { drawDrops, makeDropSprite } from './drops';
import { drawEmitter } from './emitter';
import { drawPlank, drawSpinner } from './movables';
import { drawAsteroid, drawHole, drawWall } from './obstacles';
import { Particles, type BurstKind } from './particles';
import { drawPot } from './pot';
import { createStars, drawField, drawSky } from './sky';
import type { FrameState, Insets, View } from './types';
import { drawGhost, drawVine } from './vines';

// Отрисовка на Canvas 2D: звёздное небо, уровень, капли, частицы.
// Мир 800×800 вписывается в экран целиком; вокруг него — небо.

export class Renderer {
  view: View = { scale: 1, ox: 0, oy: 0 };
  private readonly ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private readonly stars = createStars();
  private readonly particles = new Particles();
  private readonly dropSprite: HTMLCanvasElement;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.dropSprite = makeDropSprite();
  }

  resize(width: number, height: number, insets: Insets) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const availW = Math.max(100, width - insets.left - insets.right);
    const availH = Math.max(100, height - insets.top - insets.bottom);
    const scale = Math.min(availW / WORLD_SIZE, availH / WORLD_SIZE);
    this.view = {
      scale,
      ox: insets.left + (availW - WORLD_SIZE * scale) / 2,
      oy: insets.top + (availH - WORLD_SIZE * scale) / 2,
    };
  }

  toWorld(clientX: number, clientY: number): Vec {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - this.view.ox) / this.view.scale,
      y: (clientY - rect.top - this.view.oy) / this.view.scale,
    };
  }

  /** Экранные координаты точки мира (для пузыря-подсказки и т.п.). */
  toScreen(p: Vec): Vec {
    return { x: this.view.ox + p.x * this.view.scale, y: this.view.oy + p.y * this.view.scale };
  }

  burst(x: number, y: number, kind: BurstKind) {
    this.particles.burst(x, y, kind);
  }

  draw(state: FrameState, time: number) {
    const { ctx } = this;
    drawSky(ctx, this.width, this.height, this.stars, time);
    const { sim } = state;
    if (!sim) return;

    const { scale, ox, oy } = this.view;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    drawField(ctx);
    const { level } = sim;
    level.holes?.forEach((h) => drawHole(ctx, h, time));
    level.walls?.forEach((w) => drawWall(ctx, w));
    level.asteroids?.forEach((a) => drawAsteroid(ctx, a));
    drawPot(ctx, level, sim, state.bloom, time);
    if (state.ghost > 0) drawGhost(ctx, level, state.ghost, time);
    for (const line of sim.lines) drawVine(ctx, line.points, 1);
    if (state.stroke && state.stroke.length > 0) drawVine(ctx, state.stroke, 0.75);
    for (const plank of sim.planks) drawPlank(ctx, plank, plank === state.dragged, time);
    for (const spinner of sim.spinners) drawSpinner(ctx, spinner.body.position, spinner.body.angle, spinner.len);
    drawEmitter(ctx, level, sim.phase === 'pouring' && sim.emitted < level.drops, time);
    drawDrops(ctx, this.dropSprite, sim.drops);
    this.particles.draw(ctx);
    ctx.restore();
  }
}
