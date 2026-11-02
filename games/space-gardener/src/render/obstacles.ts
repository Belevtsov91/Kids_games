// Неподвижные препятствия: стены, астероиды и чёрные дыры.
import type { Vec } from '../game/ink';
import { WALL_W } from '../game/simulation';
import { roundRect } from './canvas';

/** Неровный контур астероида считается один раз на астероид. */
const asteroidShapes = new WeakMap<object, Vec[]>();

export function drawWall(ctx: CanvasRenderingContext2D, w: { x1: number; y1: number; x2: number; y2: number }) {
  const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1) + WALL_W;
  ctx.save();
  ctx.translate((w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2);
  ctx.rotate(Math.atan2(w.y2 - w.y1, w.x2 - w.x1));
  const grad = ctx.createLinearGradient(0, -WALL_W / 2, 0, WALL_W / 2);
  grad.addColorStop(0, '#aab6d6');
  grad.addColorStop(1, '#55607e');
  ctx.fillStyle = grad;
  roundRect(ctx, -len / 2, -WALL_W / 2, len, WALL_W, WALL_W / 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(30, 36, 60, 0.6)';
  for (let x = -len / 2 + 18; x < len / 2 - 10; x += 34) {
    ctx.beginPath();
    ctx.arc(x, 0, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawAsteroid(ctx: CanvasRenderingContext2D, a: { x: number; y: number; r: number }) {
  let shape = asteroidShapes.get(a);
  if (!shape) {
    shape = Array.from({ length: 14 }, (_, i) => {
      const ang = (i / 14) * Math.PI * 2;
      const rr = a.r * (1 + Math.sin(i * 2.7 + a.x) * 0.06);
      return { x: Math.cos(ang) * rr, y: Math.sin(ang) * rr };
    });
    asteroidShapes.set(a, shape);
  }
  ctx.save();
  ctx.translate(a.x, a.y);
  const grad = ctx.createRadialGradient(-a.r * 0.4, -a.r * 0.4, a.r * 0.1, 0, 0, a.r * 1.1);
  grad.addColorStop(0, '#b9a9c9');
  grad.addColorStop(1, '#5d4f73');
  ctx.fillStyle = grad;
  ctx.beginPath();
  shape.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(60, 45, 80, 0.45)';
  for (const [cx, cy, cr] of [
    [0.3, -0.2, 0.22],
    [-0.35, 0.3, 0.16],
    [0.1, 0.45, 0.12],
  ]) {
    ctx.beginPath();
    ctx.arc(cx * a.r, cy * a.r, cr * a.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawHole(ctx: CanvasRenderingContext2D, h: { x: number; y: number; r: number }, time: number) {
  ctx.save();
  ctx.translate(h.x, h.y);
  const reach = h.r * 3;
  const glow = ctx.createRadialGradient(0, 0, h.r * 0.5, 0, 0, reach);
  glow.addColorStop(0, 'rgba(150, 80, 255, 0.45)');
  glow.addColorStop(1, 'rgba(150, 80, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, reach, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(time / 500);
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.strokeStyle = `rgba(${200 - i * 15}, 140, 255, 0.7)`;
    ctx.beginPath();
    ctx.arc(0, 0, h.r * (1.1 + i * 0.25), 0, Math.PI * 0.9);
    ctx.stroke();
  }
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, h.r);
  core.addColorStop(0, '#000');
  core.addColorStop(0.7, '#0a0418');
  core.addColorStop(1, '#5a2aa8');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, h.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
