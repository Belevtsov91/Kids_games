// Подвижные части: доски, которые тащит ребёнок, и вертушки.
import type { Vec } from '../game/ink';
import { PLANK_W, SPINNER_W, plankEnds, type Plank } from '../game/simulation';
import { roundRect } from './canvas';

export function drawPlank(ctx: CanvasRenderingContext2D, plank: Plank, dragged: boolean, time: number) {
  const [a, b] = plankEnds(plank);
  const { len } = plank;
  ctx.save();
  ctx.translate((a.x + b.x) / 2, (a.y + b.y) / 2);
  ctx.rotate(plank.body.angle);
  const glow = dragged ? 1 : 0.5 + 0.3 * Math.sin(time / 300);
  ctx.shadowColor = `rgba(120, 240, 255, ${glow})`;
  ctx.shadowBlur = dragged ? 24 : 14;
  const grad = ctx.createLinearGradient(0, -PLANK_W / 2, 0, PLANK_W / 2);
  grad.addColorStop(0, '#c9fbff');
  grad.addColorStop(1, '#3fc4e6');
  ctx.fillStyle = grad;
  roundRect(ctx, -len / 2, -PLANK_W / 2, len, PLANK_W, PLANK_W / 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Точки-«ручка»: значит, доску можно двигать.
  ctx.fillStyle = 'rgba(20, 70, 110, 0.6)';
  for (const dx of [-16, -6, 4, 14]) {
    ctx.beginPath();
    ctx.arc(dx, 0, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSpinner(ctx: CanvasRenderingContext2D, pos: Vec, angle: number, len: number) {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angle);
  ctx.fillStyle = '#ffb347';
  roundRect(ctx, -len / 2, -SPINNER_W / 2, len, SPINNER_W, SPINNER_W / 2);
  ctx.fill();
  ctx.fillStyle = '#4aa3ff';
  for (const s of [-1, 1]) {
    roundRect(ctx, s * len * 0.25 - 16, -SPINNER_W / 2 + 2, 32, SPINNER_W - 4, 3);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#e8e8f5';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff5d73';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
  ctx.fill();
}
