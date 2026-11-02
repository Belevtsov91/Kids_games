// Горшок на летающем островке и растение в нём.
import type { Level } from '../game/levels';
import { POT_H, POT_WALL, type Simulation } from '../game/simulation';
import { roundRect } from './canvas';
import { drawPlant } from './plant';

export function drawPot(ctx: CanvasRenderingContext2D, level: Level, sim: Simulation, bloom: number, time: number) {
  const { x, y, w } = level.pot;
  const top = y - POT_H;
  const outer = w / 2 + POT_WALL;

  // Летающий островок под горшком.
  ctx.save();
  ctx.fillStyle = '#4b3a6b';
  ctx.beginPath();
  ctx.moveTo(x - outer - 26, y + POT_WALL);
  ctx.quadraticCurveTo(x, y + POT_WALL + 70, x + outer + 26, y + POT_WALL);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6fd18c';
  roundRect(ctx, x - outer - 30, y + POT_WALL - 6, (outer + 30) * 2, 12, 6);
  ctx.fill();
  ctx.restore();

  drawPlant(ctx, x, top, sim.growth, bloom, time);

  // Сам горшок: чуть шире кверху, поверх физических стенок.
  ctx.save();
  const potGrad = ctx.createLinearGradient(x - outer, 0, x + outer, 0);
  potGrad.addColorStop(0, '#d2693c');
  potGrad.addColorStop(0.5, '#f08a52');
  potGrad.addColorStop(1, '#c25a30');
  ctx.fillStyle = potGrad;
  ctx.beginPath();
  ctx.moveTo(x - outer - 4, top);
  ctx.lineTo(x + outer + 4, top);
  ctx.lineTo(x + outer - 6, y + POT_WALL);
  ctx.lineTo(x - outer + 6, y + POT_WALL);
  ctx.closePath();
  ctx.fill();
  // Земля и вода внутри видны через «окошко».
  ctx.fillStyle = '#5b3a24';
  roundRect(ctx, x - w / 2, top + 12, w, POT_H - 12, 8);
  ctx.fill();
  const water = sim.growth * (POT_H - 20);
  ctx.fillStyle = 'rgba(110, 200, 255, 0.55)';
  roundRect(ctx, x - w / 2 + 4, y - water - 2, w - 8, water, 6);
  ctx.fill();
  ctx.fillStyle = '#e07a45';
  roundRect(ctx, x - outer - 8, top - 6, (outer + 8) * 2, 16, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, x - outer - 2, top - 3, (outer + 2) * 2 * 0.4, 5, 3);
  ctx.fill();
  ctx.restore();
}
