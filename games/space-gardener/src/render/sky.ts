// Фон: звёздное небо с туманностями и рамка игрового поля.
import { WORLD_SIZE } from '../game/simulation';
import { roundRect } from './canvas';

export interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
}

/** Звёзды в долях экрана, чтобы не пересчитывать их при повороте телефона. */
export const createStars = (count = 160): Star[] =>
  Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.4 + 0.3,
    phase: Math.random() * Math.PI * 2,
  }));

export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, stars: readonly Star[], time: number) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0b0f2e');
  bg.addColorStop(0.6, '#1a1146');
  bg.addColorStop(1, '#2a0f45');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const nebula = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  nebula(w * 0.15, h * 0.2, Math.max(w, h) * 0.45, 'rgba(90, 60, 200, 0.25)');
  nebula(w * 0.85, h * 0.8, Math.max(w, h) * 0.5, 'rgba(200, 60, 160, 0.18)');

  for (const s of stars) {
    const a = 0.45 + 0.55 * Math.sin(time / 700 + s.phase) ** 2;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Пунктирная рамка мира 800×800. */
export function drawField(ctx: CanvasRenderingContext2D) {
  ctx.save();
  roundRect(ctx, 0, 0, WORLD_SIZE, WORLD_SIZE, 36);
  ctx.fillStyle = 'rgba(120, 160, 255, 0.05)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 12]);
  ctx.strokeStyle = 'rgba(140, 180, 255, 0.22)';
  ctx.stroke();
  ctx.restore();
}
