// Тёпа на родной планете-острове: рисуем 2D-кистью в том же стиле, что обложка, —
// сиреневый остров, медвежонок с розовым шарфом.
import type { Body } from '../game/physics';

const circle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string | CanvasGradient) => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};

/** Родная планета — круглый остров с травянистой «шапкой» и камешками снизу. */
export const drawHome = (ctx: CanvasRenderingContext2D, b: Body) => {
  const g = ctx.createRadialGradient(b.x - b.r * 0.4, b.y - b.r * 0.5, b.r * 0.2, b.x, b.y, b.r);
  g.addColorStop(0, '#c9c2ff');
  g.addColorStop(1, '#7a5aa8');
  circle(ctx, b.x, b.y, b.r, g);
  ctx.fillStyle = '#a59cff';
  ctx.beginPath();
  ctx.ellipse(b.x, b.y - b.r * 0.35, b.r * 0.95, b.r * 0.55, 0, Math.PI, 0);
  ctx.fill();
  circle(ctx, b.x - b.r * 0.4, b.y + b.r * 0.45, b.r * 0.12, '#6a5f90');
  circle(ctx, b.x + b.r * 0.35, b.y + b.r * 0.55, b.r * 0.09, '#6a5f90');
};

/** Медвежонок Тёпа стоит на макушке планеты. wave — 0…1, машет лапкой при победе. */
export const drawBear = (ctx: CanvasRenderingContext2D, b: Body, wave = 0) => {
  const s = (b.r / 34) * 1.35;
  const x = b.x - 4 * s;
  const y = b.y - b.r - 13 * s;
  const fur = '#b8743a';
  const belly = '#f1c48d';
  circle(ctx, x - 9 * s, y - 20 * s, 5 * s, fur);
  circle(ctx, x + 9 * s, y - 20 * s, 5 * s, fur);
  circle(ctx, x, y + 4 * s, 13 * s, fur);
  circle(ctx, x, y + 7 * s, 8 * s, belly);
  circle(ctx, x, y - 12 * s, 11 * s, fur);
  circle(ctx, x, y - 8 * s, 5 * s, belly);
  circle(ctx, x - 4 * s, y - 14 * s, 1.6 * s, '#2b1d14');
  circle(ctx, x + 4 * s, y - 14 * s, 1.6 * s, '#2b1d14');
  circle(ctx, x, y - 9.5 * s, 1.8 * s, '#2b1d14');
  circle(ctx, x - 7 * s, y - 10 * s, 2 * s, '#ff9fb8');
  circle(ctx, x + 7 * s, y - 10 * s, 2 * s, '#ff9fb8');
  // шарф
  ctx.fillStyle = '#ff7aa8';
  ctx.beginPath();
  ctx.ellipse(x, y - 2 * s, 10 * s, 3.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + 3 * s, y - 2 * s, 4 * s, 10 * s);
  // лапка: поднята, когда Тёпа машет
  const a = -0.4 - wave * 1.6;
  circle(ctx, x + 13 * s + Math.cos(a) * 6 * s, y + 2 * s + Math.sin(a) * 6 * s, 4 * s, fur);
  circle(ctx, x - 13 * s, y + 4 * s, 4 * s, fur);
};
