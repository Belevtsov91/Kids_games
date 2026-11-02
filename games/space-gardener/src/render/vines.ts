// Лианы игрока и пунктир подсказки-решения.
import type { Vec } from '../game/ink';
import type { Level } from '../game/levels';
import { LINE_W, PLANK_W } from '../game/simulation';
import { roundRect } from './canvas';

export function drawVine(ctx: CanvasRenderingContext2D, points: readonly Vec[], alpha: number) {
  if (points.length === 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    if (points.length === 1) ctx.lineTo(points[0].x + 0.1, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const mx = (points[i].x + points[i + 1].x) / 2;
      const my = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
    }
    const last = points[points.length - 1];
    if (points.length > 1) ctx.lineTo(last.x, last.y);
  };
  path();
  ctx.strokeStyle = '#1f7a3e';
  ctx.lineWidth = LINE_W + 4;
  ctx.stroke();
  path();
  ctx.strokeStyle = '#4fd47a';
  ctx.lineWidth = LINE_W;
  ctx.stroke();
  path();
  ctx.strokeStyle = 'rgba(210, 255, 200, 0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Листики через каждые ~45 единиц.
  let acc = 0;
  let side = 1;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    acc += seg;
    if (acc < 45) continue;
    acc = 0;
    side = -side;
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(ang + side * 0.9);
    ctx.fillStyle = '#7ef09a';
    ctx.beginPath();
    ctx.ellipse(0, -side * 10, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function drawGhost(ctx: CanvasRenderingContext2D, level: Level, alpha: number, time: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.setLineDash([16, 12]);
  ctx.lineDashOffset = -time / 30;
  ctx.lineCap = 'round';
  ctx.lineWidth = LINE_W;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  for (const line of level.solution.lines) {
    ctx.beginPath();
    line.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
  }
  level.solution.planks?.forEach((p, i) => {
    const len = level.planks?.[i]?.len ?? 200;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(120, 240, 255, 0.95)';
    roundRect(ctx, -len / 2, -PLANK_W / 2, len, PLANK_W, PLANK_W / 2);
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}
